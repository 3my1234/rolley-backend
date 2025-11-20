import { AiService } from './ai.service';
export declare class AiController {
    private aiService;
    constructor(aiService: AiService);
    analyzeMatches(req: any, body: {
        matches: any[];
    }): Promise<any>;
}
