export type timestamp = number // millisecond

export const timerAPIs = {
	'process.hrtime':
		typeof process === 'object' && process && typeof process.hrtime === 'function'
		? () => {
			const [s, ns] = process.hrtime()
			return s * 1e3 + ns * 1e-6
		} : null,
	'performance.now':
		typeof performance === 'object' && performance && typeof performance.now === 'function'
		? () => performance.now() : null,
	'Date.now':
		typeof Date.now === 'function'
		? () => Date.now() : null,
}

export type TimerAPI = keyof typeof timerAPIs

export default class Timer {
	readonly api: TimerAPI | 'new Date'
	readonly now: () => timestamp
	readonly resolution: timestamp
	readonly cost: timestamp
	readonly newStartNow: () => timestamp

	constructor(...apis: TimerAPI[]) {
		if (apis.length === 0) apis = Object.keys(timerAPIs) as TimerAPI[]
		;[this.api, this.now] = this.initAPI(apis)
		;[this.resolution, this.cost, this.newStartNow] = this.initRes()
	}

	private initAPI(apis: TimerAPI[]): [TimerAPI | 'new Date', () => timestamp] {
		for (const api of apis) {
			const now = timerAPIs[api]
			if (now != null) {
				return [api, now]
			}
		}
		// fallback to ES3
		return ['new Date', () => new Date().getTime()]
	}

	private initRes(): [timestamp, timestamp, () => timestamp] {

		let minInterval = 1000
		let maxNoUpdates = 0

		let updates = 0
		let noUpdates = 0
		let t0 = this.now()
		const end = t0 + 32
		for (;;) {
			const t1 = this.now()
			const dt = t1 - t0
			if (dt === 0) {
				++noUpdates
			} else {
				if (dt < minInterval) minInterval = dt
				if (noUpdates > maxNoUpdates) maxNoUpdates = noUpdates
				++updates
				if (updates >= 2 && t1 >= end) break
				noUpdates = 0
				t0 = t1
			}
		}

		if (maxNoUpdates === 0) {
			return [0, minInterval, this.now]
		} else {
			if (!Number.isInteger(minInterval)) minInterval = Number(minInterval.toPrecision(2))
			return [minInterval, minInterval / maxNoUpdates, () => {
				const t0 = this.now()
				let t1
				do t1 = this.now()
				while (t1 === t0)
				return t1
			}]
		}
	}
}
