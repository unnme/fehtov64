export const useYandexMapsApiKey = () => {
	const rawKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
	const apiKey = typeof rawKey === 'string' && rawKey.trim() ? rawKey.trim() : undefined
	const hasApiKey = Boolean(apiKey)

	return { apiKey, hasApiKey, rawKey }
}
