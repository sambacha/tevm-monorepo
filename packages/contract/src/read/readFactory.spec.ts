import { encodeDeployData, formatAbi } from '@tevm/utils'
import { describe, expect, it } from 'vitest'
import { createContract } from '../createContract.js'
import { dummyAbi } from '../test/fixtures.js'
import { readFactory } from './readFactory.js'

const contract = createContract({
	humanReadableAbi: formatAbi(dummyAbi),
	name: 'DummyContract',
})

describe(readFactory.name, () => {
	it('should return information for read function', () => {
		const readInfo = contract.read.exampleRead('data', BigInt(420))
		expect(readInfo.args).toMatchInlineSnapshot(`
				[
				  "data",
				  420n,
				]
			`)
		expect(readInfo.abi).toMatchInlineSnapshot(`
			[
			  {
			    "inputs": [
			      {
			        "name": "str",
			        "type": "string",
			      },
			      {
			        "name": "num",
			        "type": "uint256",
			      },
			    ],
			    "name": "exampleRead",
			    "outputs": [
			      {
			        "type": "string",
			      },
			    ],
			    "stateMutability": "pure",
			    "type": "function",
			  },
			]
		`)
		expect(readInfo.humanReadableAbi).toMatchInlineSnapshot(`
        [
          "function exampleRead(string str, uint256 num) pure returns (string)",
        ]
      `)
	})

	it('should return information for read function with no args', () => {
		const readInfo = contract.read.exampleReadNoArgs()
		expect(Object.keys(readInfo).includes('args')).toBe(false)
	})

	it('should work for overloaded function', () => {
		const readInfo1Arg = contract.read.overloadedRead('data')
		expect(readInfo1Arg.args).toMatchInlineSnapshot(`
				[
				  "data",
				]
			`)
		expect(readInfo1Arg.abi).toMatchInlineSnapshot(`
			[
			  {
			    "inputs": [
			      {
			        "name": "str",
			        "type": "string",
			      },
			    ],
			    "name": "overloadedRead",
			    "outputs": [
			      {
			        "type": "string",
			      },
			    ],
			    "stateMutability": "pure",
			    "type": "function",
			  },
			  {
			    "inputs": [],
			    "name": "overloadedRead",
			    "outputs": [
			      {
			        "type": "string",
			      },
			    ],
			    "stateMutability": "pure",
			    "type": "function",
			  },
			]
		`)
		expect(readInfo1Arg.humanReadableAbi).toMatchInlineSnapshot(`
				[
				  "function overloadedRead() pure returns (string)",
				]
			`)
		const readInfo0Arg = contract.read.overloadedRead()
		expect(Object.keys(readInfo0Arg).includes('args')).toBe(false)
		expect(readInfo0Arg.abi).toMatchInlineSnapshot(`
			[
			  {
			    "inputs": [
			      {
			        "name": "str",
			        "type": "string",
			      },
			    ],
			    "name": "overloadedRead",
			    "outputs": [
			      {
			        "type": "string",
			      },
			    ],
			    "stateMutability": "pure",
			    "type": "function",
			  },
			  {
			    "inputs": [],
			    "name": "overloadedRead",
			    "outputs": [
			      {
			        "type": "string",
			      },
			    ],
			    "stateMutability": "pure",
			    "type": "function",
			  },
			]
		`)
		expect(readInfo0Arg.humanReadableAbi).toMatchInlineSnapshot(`
				[
				  "function overloadedRead() pure returns (string)",
				]
			`)
	})

	it('should work with a contract without deployedBytecode', () => {
		const contractWithoutDeployedBytecode = createContract({
			name: 'DummyContractNoDeployed',
			humanReadableAbi: formatAbi(dummyAbi),
			bytecode: '0x420',
		})
		const read = contractWithoutDeployedBytecode.read.exampleRead('test', BigInt(123))
		expect(read).toMatchObject({
			abi: expect.any(Array),
			functionName: 'exampleRead',
			args: ['test', BigInt(123)],
		})
		expect((read as any).deployedBytecode).toBeUndefined()
		expect((read as any).code).toBeUndefined()
	})

	it('should return an empty object when the provided methods includes no functions', () => {
		const dummyAbiNoFunction = dummyAbi.filter((abi) => abi.type !== 'function')
		const read = readFactory({
			methods: dummyAbiNoFunction,
			errors: [],
		})
		expect(read).toEqual({})
	})

	it('should return an empty object when methods is an empty array', () => {
		const read = readFactory({ methods: [], errors: [] })
		expect(Object.keys(read)).toHaveLength(0)
	})

	it('should work with a script', () => {
		const script = createContract({
			name: 'DummyScript',
			humanReadableAbi: formatAbi(dummyAbi),
			bytecode: '0x420',
			deployedBytecode: '0x69',
		}).withCode(
			encodeDeployData({
				abi: dummyAbi,
				bytecode: '0x420',
			}),
		)
		expect(script.read.exampleRead('data', BigInt(420))).toMatchInlineSnapshot(`
			{
			  "abi": [
			    {
			      "inputs": [
			        {
			          "name": "str",
			          "type": "string",
			        },
			        {
			          "name": "num",
			          "type": "uint256",
			        },
			      ],
			      "name": "exampleRead",
			      "outputs": [
			        {
			          "type": "string",
			        },
			      ],
			      "stateMutability": "pure",
			      "type": "function",
			    },
			  ],
			  "args": [
			    "data",
			    420n,
			  ],
			  "code": "0x420",
			  "functionName": "exampleRead",
			  "humanReadableAbi": [
			    "function exampleRead(string str, uint256 num) pure returns (string)",
			  ],
			}
		`)
	})
})
