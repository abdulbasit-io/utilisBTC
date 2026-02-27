import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    Blockchain,
    BytesWriter,
    Calldata,
    OP20,
    OP20InitParameters,
    Revert,
    SafeMath,
    StoredU256,
} from '@btc-vision/btc-runtime/runtime';
import { EMPTY_POINTER } from '@btc-vision/btc-runtime/runtime/math/bytes';

// ═══════════════════════════════════════════════════════════
// utilisBTC — BTC-Collateralized Lending Smart Contract
// ═══════════════════════════════════════════════════════════
//
// Extends OP20 to create a peer-to-peer lending protocol.
// Borrowers lock BTC collateral and request USDT loans.
// Lenders fund loans and earn interest. Expired loans can
// be liquidated by the lender.
// ═══════════════════════════════════════════════════════════

// Storage pointers (auto-assigned after OP20's pointers)
const loanCounterPointer: u16 = Blockchain.nextPointer;
const platformFeePointer: u16 = Blockchain.nextPointer;

// Per-loan storage uses pointer offsets from a base
// Each loan occupies 10 sequential pointers
const LOAN_BASE_POINTER: u16 = 200;
const SLOTS_PER_LOAN: u16 = 10;

// Field offsets within a loan's storage block
const F_BORROWER: u16 = 0;
const F_LENDER: u16 = 1;
const F_COLLATERAL: u16 = 2;
const F_AMOUNT: u16 = 3;
const F_INTEREST_BPS: u16 = 4;
const F_DURATION: u16 = 5;
const F_STATUS: u16 = 6;
const F_CREATED_AT: u16 = 7;
const F_FUNDED_AT: u16 = 8;
const F_REPAYMENT: u16 = 9;

// Loan status constants
const STATUS_PENDING: u256 = u256.fromU64(0);
const STATUS_ACTIVE: u256 = u256.fromU64(1);
const STATUS_REPAID: u256 = u256.fromU64(2);
const STATUS_LIQUIDATED: u256 = u256.fromU64(3);
const STATUS_CANCELLED: u256 = u256.fromU64(4);

// Platform constants
const BASIS_POINTS: u256 = u256.fromU64(10000);
const PLATFORM_FEE_BPS: u256 = u256.fromU64(200);  // 2%
const BLOCKS_PER_DAY: u256 = u256.fromU64(144);     // ~144 Bitcoin blocks per day

@final
export class utilisBTC extends OP20 {
    private loanCounter: StoredU256;
    private platformFees: StoredU256;

    public constructor() {
        super();

        this.loanCounter = new StoredU256(loanCounterPointer, EMPTY_POINTER);
        this.platformFees = new StoredU256(platformFeePointer, EMPTY_POINTER);
    }

    // ─── Deployment ────────────────────────────────────────
    public override onDeployment(_calldata: Calldata): void {
        const maxSupply: u256 = u256.fromString('10000000000000000'); // 100M with 8 decimals
        const decimals: u8 = 8;
        const name: string = 'utilisBTC';
        const symbol: string = 'HODL';

        this.instantiate(new OP20InitParameters(maxSupply, decimals, name, symbol));

        // Mint initial supply to deployer
        this._mint(Blockchain.tx.origin, maxSupply);
    }

    public override onUpdate(_calldata: Calldata): void {
        super.onUpdate(_calldata);
    }

    // ─── Storage Helpers ───────────────────────────────────
    private loanPointer(loanId: u64, field: u16): u16 {
        return LOAN_BASE_POINTER + <u16>(loanId * <u64>SLOTS_PER_LOAN) + field;
    }

    private storeLoanField(loanId: u64, field: u16, value: u256): void {
        const p = this.loanPointer(loanId, field);
        const s = new StoredU256(p, EMPTY_POINTER);
        s.set(value);
    }

    private readLoanField(loanId: u64, field: u16): u256 {
        const p = this.loanPointer(loanId, field);
        const s = new StoredU256(p, EMPTY_POINTER);
        return s.value;
    }

    // ─── Create Loan Request ───────────────────────────────
    // Borrower creates a loan request specifying collateral, amount, duration, rate
    @method(
        { name: 'collateralSats', type: ABIDataTypes.UINT256 },
        { name: 'loanAmount', type: ABIDataTypes.UINT256 },
        { name: 'durationDays', type: ABIDataTypes.UINT256 },
        { name: 'interestRateBps', type: ABIDataTypes.UINT256 },
    )
    @returns({ name: 'loanId', type: ABIDataTypes.UINT256 })
    public createLoan(calldata: Calldata): BytesWriter {
        const collateral: u256 = calldata.readU256();
        const loanAmount: u256 = calldata.readU256();
        const durationDaare you donw with that? This is the deployed contract address: "opt1sqrpxenjta0hgpdzr32jc6gucr3llwv6scvn0p5ha", update the codebase as necessary but make sure the address is in a .env file that will not be commited or push. after you're done with that, we have some fixing to do on the frontendys: u256 = calldata.readU256();
        const interestBps: u256 = calldata.readU256();

        // Validate
        if (collateral.isZero()) throw new Revert('Collateral must be > 0');
        if (loanAmount.isZero()) throw new Revert('Amount must be > 0');
        if (durationDays.isZero()) throw new Revert('Duration must be > 0');

        // Calculate interest: (amount * rateBps * days) / (365 * 10000)
        const num: u256 = SafeMath.mul(SafeMath.mul(loanAmount, interestBps), durationDays);
        const den: u256 = SafeMath.mul(u256.fromU64(365), BASIS_POINTS);
        const interest: u256 = SafeMath.div(num, den);

        // Platform fee on interest
        const fee: u256 = SafeMath.div(SafeMath.mul(interest, PLATFORM_FEE_BPS), BASIS_POINTS);

        // Total repayment = principal + interest + fee
        const totalRepayment: u256 = SafeMath.add(SafeMath.add(loanAmount, interest), fee);

        // Get and increment loan counter
        const loanId: u64 = this.loanCounter.value.toU64();
        this.loanCounter.set(SafeMath.add(this.loanCounter.value, u256.One));

        // Duration in blocks
        const durationBlocks: u256 = SafeMath.mul(durationDays, BLOCKS_PER_DAY);

        // Store loan data — Address extends Uint8Array, convert to u256 for storage
        const sender: Address = Blockchain.tx.sender;
        const borrowerHash: u256 = u256.fromUint8ArrayBE(sender);
        this.storeLoanField(loanId, F_BORROWER, borrowerHash);
        this.storeLoanField(loanId, F_LENDER, u256.Zero);
        this.storeLoanField(loanId, F_COLLATERAL, collateral);
        this.storeLoanField(loanId, F_AMOUNT, loanAmount);
        this.storeLoanField(loanId, F_INTEREST_BPS, interestBps);
        this.storeLoanField(loanId, F_DURATION, durationBlocks);
        this.storeLoanField(loanId, F_STATUS, STATUS_PENDING);
        this.storeLoanField(loanId, F_CREATED_AT, u256.fromU64(Blockchain.block.number));
        this.storeLoanField(loanId, F_FUNDED_AT, u256.Zero);
        this.storeLoanField(loanId, F_REPAYMENT, totalRepayment);

        const writer = new BytesWriter(32);
        writer.writeU256(u256.fromU64(loanId));
        return writer;
    }

    // ─── Fund Loan ─────────────────────────────────────────
    // Lender funds a pending loan
    @method({ name: 'loanId', type: ABIDataTypes.UINT256 })
    @returns({ name: 'loanId', type: ABIDataTypes.UINT256 })
    public fundLoan(calldata: Calldata): BytesWriter {
        const loanIdU256: u256 = calldata.readU256();
        const loanId: u64 = loanIdU256.toU64();

        const status: u256 = this.readLoanField(loanId, F_STATUS);
        if (!u256.eq(status, STATUS_PENDING)) throw new Revert('Loan not pending');

        const borrowerHash: u256 = this.readLoanField(loanId, F_BORROWER);
        const lenderHash: u256 = u256.fromUint8ArrayBE(Blockchain.tx.sender);
        if (u256.eq(borrowerHash, lenderHash)) throw new Revert('Cannot fund own loan');

        this.storeLoanField(loanId, F_LENDER, lenderHash);
        this.storeLoanField(loanId, F_STATUS, STATUS_ACTIVE);
        this.storeLoanField(loanId, F_FUNDED_AT, u256.fromU64(Blockchain.block.number));

        const writer = new BytesWriter(32);
        writer.writeU256(loanIdU256);
        return writer;
    }

    // ─── Repay Loan ────────────────────────────────────────
    // Borrower repays and unlocks collateral
    @method({ name: 'loanId', type: ABIDataTypes.UINT256 })
    @returns({ name: 'loanId', type: ABIDataTypes.UINT256 })
    public repayLoan(calldata: Calldata): BytesWriter {
        const loanIdU256: u256 = calldata.readU256();
        const loanId: u64 = loanIdU256.toU64();

        const status: u256 = this.readLoanField(loanId, F_STATUS);
        if (!u256.eq(status, STATUS_ACTIVE)) throw new Revert('Loan not active');

        const borrowerHash: u256 = this.readLoanField(loanId, F_BORROWER);
        const callerHash: u256 = u256.fromUint8ArrayBE(Blockchain.tx.sender);
        if (!u256.eq(borrowerHash, callerHash)) throw new Revert('Only borrower can repay');

        this.storeLoanField(loanId, F_STATUS, STATUS_REPAID);

        const writer = new BytesWriter(32);
        writer.writeU256(loanIdU256);
        return writer;
    }

    // ─── Liquidate Loan ────────────────────────────────────
    // Lender liquidates expired loan
    @method({ name: 'loanId', type: ABIDataTypes.UINT256 })
    @returns({ name: 'loanId', type: ABIDataTypes.UINT256 })
    public liquidateLoan(calldata: Calldata): BytesWriter {
        const loanIdU256: u256 = calldata.readU256();
        const loanId: u64 = loanIdU256.toU64();

        const status: u256 = this.readLoanField(loanId, F_STATUS);
        if (!u256.eq(status, STATUS_ACTIVE)) throw new Revert('Loan not active');

        const lenderHash: u256 = this.readLoanField(loanId, F_LENDER);
        const callerHash: u256 = u256.fromUint8ArrayBE(Blockchain.tx.sender);
        if (!u256.eq(lenderHash, callerHash)) throw new Revert('Only lender can liquidate');

        // Check loan expired
        const fundedAt: u256 = this.readLoanField(loanId, F_FUNDED_AT);
        const duration: u256 = this.readLoanField(loanId, F_DURATION);
        const expiresAt: u256 = SafeMath.add(fundedAt, duration);
        const currentBlock: u256 = u256.fromU64(Blockchain.block.number);
        if (u256.lt(currentBlock, expiresAt)) throw new Revert('Loan not expired');

        this.storeLoanField(loanId, F_STATUS, STATUS_LIQUIDATED);

        const writer = new BytesWriter(32);
        writer.writeU256(loanIdU256);
        return writer;
    }

    // ─── Cancel Loan ───────────────────────────────────────
    // Borrower cancels a pending loan
    @method({ name: 'loanId', type: ABIDataTypes.UINT256 })
    @returns({ name: 'loanId', type: ABIDataTypes.UINT256 })
    public cancelLoan(calldata: Calldata): BytesWriter {
        const loanIdU256: u256 = calldata.readU256();
        const loanId: u64 = loanIdU256.toU64();

        const status: u256 = this.readLoanField(loanId, F_STATUS);
        if (!u256.eq(status, STATUS_PENDING)) throw new Revert('Can only cancel pending');

        const borrowerHash: u256 = this.readLoanField(loanId, F_BORROWER);
        const callerHash: u256 = u256.fromUint8ArrayBE(Blockchain.tx.sender);
        if (!u256.eq(borrowerHash, callerHash)) throw new Revert('Only borrower can cancel');

        this.storeLoanField(loanId, F_STATUS, STATUS_CANCELLED);

        const writer = new BytesWriter(32);
        writer.writeU256(loanIdU256);
        return writer;
    }

    // ─── Read: Get Loan Details ────────────────────────────
    @method({ name: 'loanId', type: ABIDataTypes.UINT256 })
    @returns(
        { name: 'borrower', type: ABIDataTypes.UINT256 },
        { name: 'lender', type: ABIDataTypes.UINT256 },
        { name: 'collateral', type: ABIDataTypes.UINT256 },
        { name: 'amount', type: ABIDataTypes.UINT256 },
        { name: 'interestBps', type: ABIDataTypes.UINT256 },
        { name: 'duration', type: ABIDataTypes.UINT256 },
        { name: 'status', type: ABIDataTypes.UINT256 },
        { name: 'createdAt', type: ABIDataTypes.UINT256 },
        { name: 'fundedAt', type: ABIDataTypes.UINT256 },
        { name: 'repayment', type: ABIDataTypes.UINT256 },
    )
    public getLoan(calldata: Calldata): BytesWriter {
        const loanId: u64 = calldata.readU256().toU64();

        const writer = new BytesWriter(320);
        writer.writeU256(this.readLoanField(loanId, F_BORROWER));
        writer.writeU256(this.readLoanField(loanId, F_LENDER));
        writer.writeU256(this.readLoanField(loanId, F_COLLATERAL));
        writer.writeU256(this.readLoanField(loanId, F_AMOUNT));
        writer.writeU256(this.readLoanField(loanId, F_INTEREST_BPS));
        writer.writeU256(this.readLoanField(loanId, F_DURATION));
        writer.writeU256(this.readLoanField(loanId, F_STATUS));
        writer.writeU256(this.readLoanField(loanId, F_CREATED_AT));
        writer.writeU256(this.readLoanField(loanId, F_FUNDED_AT));
        writer.writeU256(this.readLoanField(loanId, F_REPAYMENT));
        return writer;
    }

    // ─── Read: Get Loan Count ──────────────────────────────
    @method()
    @returns({ name: 'count', type: ABIDataTypes.UINT256 })
    public getLoanCount(_: Calldata): BytesWriter {
        const writer = new BytesWriter(32);
        writer.writeU256(this.loanCounter.value);
        return writer;
    }
}
