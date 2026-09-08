import { cre, ok, text, type TeeRuntime, hexToBase64 } from '@chainlink/cre-sdk'
import { encodeAbiParameters, parseAbiParameters } from 'viem'
import { z } from 'zod'

export const configSchema = z.object({
	schedule: z.string(),
	spenderRiskUrl: z.string(),
	spender: z.string(),
	standingAccess: z.boolean(),
	unlimitedAmount: z.boolean(),
	secretId: z.string(),
})
type Config = z.infer<typeof configSchema>

type Verdict = 'ALLOW' | 'DENY' | 'MANUAL_REVIEW'

interface VerdictResult {
	verdict: Verdict
	reasons: string[]
}

const REPEAT_SPENDER_WALLET_THRESHOLD = 2

const computeVerdict = (
	standingAccess: boolean,
	unlimitedAmount: boolean,
	distinctWallets: number,
): VerdictResult => {
	if (!standingAccess) {
		return { verdict: 'ALLOW', reasons: ['This is a one-time transfer, not a standing approval.'] }
	}

	const reasons: string[] = ['This grants standing, repeatable access rather than a one-time transfer.']

	if (distinctWallets >= REPEAT_SPENDER_WALLET_THRESHOLD) {
		reasons.push(
			`${distinctWallets} other wallets have granted this same address standing approvals — a known drainer pattern.`,
		)
		return { verdict: 'DENY', reasons }
	}

	if (unlimitedAmount) {
		reasons.push('The amount is effectively unlimited.')
		return { verdict: 'DENY', reasons }
	}

	reasons.push('The amount is bounded, but standing access still needs a human decision.')
	return { verdict: 'MANUAL_REVIEW', reasons }
}

export const onCronTrigger = (runtime: TeeRuntime<Config>): string => {
	const config = runtime.config

	const apiToken = runtime.getSecret({ id: config.secretId }).result().value

	const response = new cre.capabilities.HTTPClient()
		.sendRequest(runtime, {
			url: `${config.spenderRiskUrl}?spender=${config.spender}`,
			method: 'GET',
			multiHeaders: {
				Authorization: { values: [`Bearer ${apiToken}`] },
			},
		})
		.result()

	if (!ok(response)) {
		throw new Error(`Confidential request failed with status: ${response.statusCode}`)
	}

	const body = text(response)
	const parsed = JSON.parse(body) as { distinctWallets: number }
	const { verdict, reasons } = computeVerdict(config.standingAccess, config.unlimitedAmount, parsed.distinctWallets)

	runtime.log(`Enclave computation complete. verdict=${verdict} distinctWallets=${parsed.distinctWallets}`)

	const donRuntime = runtime.usingTheDons()

	const encodedPayload = encodeAbiParameters(
		parseAbiParameters('string verdict, uint256 distinctWallets'),
		[verdict, BigInt(parsed.distinctWallets)],
	)

	donRuntime
		.report({
			encodedPayload: hexToBase64(encodedPayload),
			encoderName: 'evm',
			signingAlgo: 'ecdsa',
			hashingAlgo: 'keccak256',
		})
		.result()

	return `${verdict} (distinctWallets: ${parsed.distinctWallets}) — ${reasons.join(' ')}`
}

export function initWorkflow(config: Config) {
	const cronTrigger = new cre.capabilities.CronCapability()

	return [
		cre.handlerInTee(cronTrigger.trigger({ schedule: config.schedule }), onCronTrigger, [
			{ tee: 'nitro', regions: ['us-west-2'] },
		]),
	]
}
