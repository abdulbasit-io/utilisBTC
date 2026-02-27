import { ABIDataTypes, BitcoinAbiTypes, OP_NET_ABI } from 'opnet';

export const utilisBTCEvents = [];

export const utilisBTCAbi = [
    {
        name: 'createLoan',
        inputs: [
            { name: 'collateralSats', type: ABIDataTypes.UINT256 },
            { name: 'loanAmount', type: ABIDataTypes.UINT256 },
            { name: 'durationDays', type: ABIDataTypes.UINT256 },
            { name: 'interestRateBps', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'fundLoan',
        inputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'repayLoan',
        inputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'liquidateLoan',
        inputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'cancelLoan',
        inputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getLoan',
        inputs: [{ name: 'loanId', type: ABIDataTypes.UINT256 }],
        outputs: [
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
        ],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getLoanCount',
        inputs: [],
        outputs: [{ name: 'count', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    ...utilisBTCEvents,
    ...OP_NET_ABI,
];

export default utilisBTCAbi;
