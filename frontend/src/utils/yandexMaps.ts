export interface YMapEvent {
	get: (key: string) => unknown
}

interface YGeometry {
	getCoordinates: () => number[]
}

interface YGeoObject {
	geometry: YGeometry
	getAddressLine?: () => string
}

interface YGeoObjectCollection {
	get: (index: number) => YGeoObject | null
	getLength?: () => number
}

interface YGeocodeResult {
	geoObjects: YGeoObjectCollection
}

interface YGeolocationResult {
	geoObjects: YGeoObjectCollection
}

interface YSuggestItem {
	value: string
}

export interface YPlacemark {
	geometry: {
		setCoordinates: (coords: number[]) => void
	}
}

export interface YMapInstance {
	setCenter: (coords: number[], zoom?: number) => void
	getZoom: () => number
	events: {
		add: (event: string, handler: (event: YMapEvent) => void) => void
	}
	geoObjects: {
		add: (obj: unknown) => void
	}
	destroy: () => void
}

export interface YMaps {
	ready: (callback: () => void) => void
	Map: new (
		container: HTMLElement,
		options: Record<string, unknown>
	) => YMapInstance
	Placemark: new (
		coords: number[],
		data?: Record<string, unknown>,
		options?: Record<string, unknown>
	) => YPlacemark
	geocode: (
		coords: number[] | string,
		options?: Record<string, unknown>
	) => Promise<YGeocodeResult>
	suggest: (
		query: string,
		options?: Record<string, unknown>
	) => Promise<YSuggestItem[]>
	geolocation: {
		get: (options?: Record<string, unknown>) => Promise<YGeolocationResult>
	}
}

declare global {
	interface Window {
		ymaps?: YMaps
	}
}

const SCRIPT_ID = 'yandex-maps-api'

export function loadYandexMaps(apiKey: string): Promise<YMaps> {
	return new Promise((resolve, reject) => {
		if (window.ymaps) {
			const ymapsInstance = window.ymaps
			ymapsInstance.ready(() => resolve(ymapsInstance))
			return
		}

		const existingScript = document.getElementById(SCRIPT_ID)
		if (existingScript) {
			existingScript.addEventListener('load', () => {
				const ymapsInstance = window.ymaps
				if (!ymapsInstance) {
					reject(new Error('Yandex Maps не загрузилась'))
					return
				}
				ymapsInstance.ready(() => resolve(ymapsInstance))
			})
			existingScript.addEventListener('error', () =>
				reject(new Error('Не удалось загрузить Yandex Maps'))
			)
			return
		}

		const script = document.createElement('script')
		script.id = SCRIPT_ID
		script.async = true
		script.defer = true
		script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${apiKey}`
		script.onload = () => {
			const ymapsInstance = window.ymaps
			if (!ymapsInstance) {
				reject(new Error('Yandex Maps не загрузилась'))
				return
			}
			ymapsInstance.ready(() => resolve(ymapsInstance))
		}
		script.onerror = () => reject(new Error('Не удалось загрузить Yandex Maps'))
		document.head.appendChild(script)
	})
}
