import * as vscode from 'vscode';
import { AnalysisCoordinator } from './analysisCoordinator';

export class ModelPicker {

    private cachedModel: vscode.LanguageModelChat | undefined;
    private modelSelectionPromise: Promise<vscode.LanguageModelChat | undefined> | undefined;

    constructor(
        private analysisCoordinator: AnalysisCoordinator,
        private outputChannel: vscode.OutputChannel,
    ) { }

    public clearCache(): void {
        this.cachedModel = undefined;
        this.modelSelectionPromise = undefined;
    }

    public async selectModel(analysisUri: string): Promise<vscode.LanguageModelChat | undefined> {
        if (this.cachedModel) {
            return this.cachedModel;
        }
        if (this.modelSelectionPromise) {
            return this.modelSelectionPromise;
        }

        this.modelSelectionPromise = this.pickModel(analysisUri);
        try {
            const model = await this.modelSelectionPromise;
            if (!model) {
                this.analysisCoordinator?.markAnalysisStageWithRequestCount(analysisUri, 'No model available.');
                return undefined;
            }
            this.cachedModel = model;
            this.markAndLog(analysisUri, `Using model: ${model.name}`);
            this.outputChannel.appendLine(`[LLM Proxy] Using model: ${model.name} (${model.vendor}/${model.family})`);
            return model;
        } finally {
            this.modelSelectionPromise = undefined;
        }
    }

    private async pickModel(analysisUri: string): Promise<vscode.LanguageModelChat | undefined> {
        if (!vscode.lm.selectChatModels) {
            return undefined;
        }

        const configured = vscode.workspace.getConfiguration('chatCustomizationsEvaluations').get<string>('model', '').trim();
        if (configured) {
            this.markAndLog(analysisUri, `Looking for user-selected model: ${configured}`);
            const userSelected = await this.selectFirstModel(
                () => vscode.lm.selectChatModels({ family: configured }),
                'User model matches',
            );
            if (userSelected) {
                this.markAndLog(analysisUri, `Using user-selected model: ${userSelected.name} (${userSelected.vendor}/${userSelected.family})`);
                return userSelected;
            }
            this.markAndLog(analysisUri, 'User model not found, falling back to default selection...');
        }

        this.markAndLog(analysisUri, 'Discovering Copilot models (claude-sonnet-4.6)...');
        this.outputChannel.appendLine('[LLM Proxy] Selecting chat models...');

        const claude = await this.selectFirstModel(
            () => vscode.lm.selectChatModels({ vendor: 'copilot', family: 'claude-sonnet-4.6' }),
            'claude-sonnet-4.6 models',
        );
        if (claude) {
            return claude;
        }

        this.markAndLog(analysisUri, 'No claude-sonnet-4.6 model found, trying any Copilot model...');
        const anyCopilot = await this.selectFirstModel(
            () => vscode.lm.selectChatModels({ vendor: 'copilot' }),
            'Any Copilot models',
        );
        if (anyCopilot) {
            return anyCopilot;
        }

        this.markAndLog(analysisUri, 'No Copilot-only match, trying all available models...');
        return this.selectFirstModel(() => vscode.lm.selectChatModels(), 'Any models');
    }

    private async selectFirstModel(
        query: () => Thenable<readonly vscode.LanguageModelChat[]>,
        label: string,
    ): Promise<vscode.LanguageModelChat | undefined> {
        const models = await query();
        this.outputChannel.appendLine(`[LLM Proxy] ${label} found: ${models.length}`);
        return models[0];
    }

    private markAndLog(analysisUri: string, message: string): void {
        this.analysisCoordinator?.markAnalysisStageWithRequestCount(analysisUri, message);
        this.outputChannel.appendLine(`[LLM Proxy] ${message}`);
    }
}
