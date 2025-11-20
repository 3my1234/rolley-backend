export interface PaymentData {
    amount: number;
    currency: string;
    email: string;
    userId: string;
    redirectUrl: string;
}
export interface WithdrawalData {
    amount: number;
    currency: string;
    accountBank: string;
    accountNumber: string;
    narration: string;
    reference: string;
}
export declare function initializePayment(data: PaymentData): Promise<{
    status: string;
    data: {
        link: any;
        tx_ref: string;
    };
}>;
export declare function verifyPayment(transactionId: string): Promise<any>;
export declare function initiateWithdrawal(data: WithdrawalData): Promise<any>;
export declare function getBanks(country?: string): Promise<any>;
export declare function verifyBankAccount(accountNumber: string, accountBank: string): Promise<any>;
