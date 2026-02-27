import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the createLoan function call.
 */
export type CreateLoan = CallResult<
    {
        loanId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the fundLoan function call.
 */
export type FundLoan = CallResult<
    {
        loanId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the repayLoan function call.
 */
export type RepayLoan = CallResult<
    {
        loanId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the liquidateLoan function call.
 */
export type LiquidateLoan = CallResult<
    {
        loanId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the cancelLoan function call.
 */
export type CancelLoan = CallResult<
    {
        loanId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getLoan function call.
 */
export type GetLoan = CallResult<
    {
        borrower: bigint;
        lender: bigint;
        collateral: bigint;
        amount: bigint;
        interestBps: bigint;
        duration: bigint;
        status: bigint;
        createdAt: bigint;
        fundedAt: bigint;
        repayment: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getLoanCount function call.
 */
export type GetLoanCount = CallResult<
    {
        count: bigint;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// IHodlLend
// ------------------------------------------------------------------
export interface IHodlLend extends IOP_NETContract {
    createLoan(
        collateralSats: bigint,
        loanAmount: bigint,
        durationDays: bigint,
        interestRateBps: bigint,
    ): Promise<CreateLoan>;
    fundLoan(loanId: bigint): Promise<FundLoan>;
    repayLoan(loanId: bigint): Promise<RepayLoan>;
    liquidateLoan(loanId: bigint): Promise<LiquidateLoan>;
    cancelLoan(loanId: bigint): Promise<CancelLoan>;
    getLoan(loanId: bigint): Promise<GetLoan>;
    getLoanCount(): Promise<GetLoanCount>;
}
