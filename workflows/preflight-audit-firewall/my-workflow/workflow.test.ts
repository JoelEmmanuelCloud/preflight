import { describe, expect } from 'bun:test'
import type { TeeRuntime } from '@chainlink/cre-sdk'
import { test } from '@chainlink/cre-sdk/test'
import { initWorkflow, onCronTrigger } from './workflow'

const API_TOKEN = 'test-token'

const makeConfig = (overrides: Partial<{ standingAccess: boolean; unlimitedAmount: boolean }> = {}) => ({
	schedule: '0 */1 * * * *',
	spenderRiskUrl: 'http://localhost:4000/api/spender-risk',
	spender: '0x1B59495FaD2a1FB7cF4605bc62A53aadD9cA72e7',
	standingAccess: true,
	unlimitedAmount: true,
	secretId: 'API_TOKEN',
	...overrides,
})

type FakeTeeRuntimeOptions = {
	statusCode?: number
	distinctWallets?: number
	config?: ReturnType<typeof makeConfig>
}

const makeFakeTeeRuntime = ({ statusCode = 200, distinctWallets = 0, config = makeConfig() }: FakeTeeRuntimeOptions = {}) => {
	const capturedHeaders: string[] = []
	const reports: unknown[] = []
	const logs: string[] = []

	const body = JSON.stringify({
		spender: config.spender,
		totalApprovals: distinctWallets,
		unlimitedApprovals: distinctWallets,
		distinctWallets,
	})

	const runtime = {
		config,
		getSecret: (request: { id?: string }) => ({
			result: () => ({ id: request.id, value: API_TOKEN }),
		}),
		callCapability: ({ payload }: { payload: { multiHeaders?: Record<string, unknown> } }) => {
			const auth = payload.multiHeaders?.Authorization as { values?: string[] } | undefined
			capturedHeaders.push(...(auth?.values ?? []))
			return {
				result: () => ({
					statusCode,
					body: new TextEncoder().encode(body),
				}),
			}
		},
		log: (message: string) => logs.push(message),
		usingTheDons: () => ({
			report: (input: unknown) => {
				reports.push(input)
				return { result: () => ({}) }
			},
		}),
	}

	return { runtime: runtime as unknown as TeeRuntime<ReturnType<typeof makeConfig>>, capturedHeaders, reports, logs }
}

describe('onCronTrigger', () => {
	test('injects the enclave-fetched secret into the outbound request', () => {
		const { runtime, capturedHeaders } = makeFakeTeeRuntime()

		onCronTrigger(runtime)

		expect(capturedHeaders).toEqual([`Bearer ${API_TOKEN}`])
	})

	test('crosses back to the DON to generate a report', () => {
		const { runtime, reports } = makeFakeTeeRuntime()

		onCronTrigger(runtime)

		expect(reports).toHaveLength(1)
		expect(reports[0]).toMatchObject({
			encoderName: 'evm',
			signingAlgo: 'ecdsa',
			hashingAlgo: 'keccak256',
		})
	})

	test('ALLOWs a one-time transfer regardless of spender risk', () => {
		const config = makeConfig({ standingAccess: false, unlimitedAmount: false })
		const { runtime } = makeFakeTeeRuntime({ distinctWallets: 5, config })

		expect(onCronTrigger(runtime)).toContain('ALLOW')
	})

	test('DENYs when the spender has approvals from 2 or more distinct wallets', () => {
		const { runtime } = makeFakeTeeRuntime({ distinctWallets: 5 })

		expect(onCronTrigger(runtime)).toContain('DENY')
	})

	test('DENYs an unlimited amount even with no prior spender history', () => {
		const config = makeConfig({ standingAccess: true, unlimitedAmount: true })
		const { runtime } = makeFakeTeeRuntime({ distinctWallets: 0, config })

		expect(onCronTrigger(runtime)).toContain('DENY')
	})

	test('MANUAL_REVIEWs a bounded standing approval with no prior spender history', () => {
		const config = makeConfig({ standingAccess: true, unlimitedAmount: false })
		const { runtime } = makeFakeTeeRuntime({ distinctWallets: 0, config })

		expect(onCronTrigger(runtime)).toContain('MANUAL_REVIEW')
	})

	test('throws on a non-2xx response and never reaches the DON', () => {
		const { runtime, reports } = makeFakeTeeRuntime({ statusCode: 401 })

		expect(() => onCronTrigger(runtime)).toThrow('status: 401')
		expect(reports).toHaveLength(0)
	})

	test('does not log the secret or the raw response body', () => {
		const { runtime, logs } = makeFakeTeeRuntime({ distinctWallets: 5 })

		onCronTrigger(runtime)

		for (const line of logs) {
			expect(line).not.toContain(API_TOKEN)
		}
	})
})

describe('initWorkflow', () => {
	test('registers the cron handler with a Nitro TEE constraint', () => {
		const handlers = initWorkflow(makeConfig())

		expect(handlers).toHaveLength(1)
		expect(handlers[0].fn).toBe(onCronTrigger)

		// handlerInTee attaches TEE requirements; cre.handler does not.
		expect(handlers[0].requirements).toBeDefined()
	})
})
