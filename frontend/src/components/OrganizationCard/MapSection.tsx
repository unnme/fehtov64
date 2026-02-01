import { MapPin, MapPinned, Navigation } from 'lucide-react'
import { RefObject } from 'react'
import { Control } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type OrganizationCardFormData } from '@/schemas/organizationCard'

interface MapSectionProps {
	control: Control<OrganizationCardFormData>
	mapContainerRef: RefObject<HTMLDivElement | null>
	hasApiKey: boolean
	rawKey: string | undefined
	isGeocoding: boolean
	onGetCurrentLocation: () => void
}

export const MapSection = ({
	control,
	mapContainerRef,
	hasApiKey,
	rawKey,
	isGeocoding,
	onGetCurrentLocation
}: MapSectionProps) => {
	return (
		<div className="space-y-4">
			<FormField
				control={control}
				name="address"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							Адрес организации
						</FormLabel>
						<FormControl>
							<div className="relative">
								<Input
									{...field}
									readOnly
									value={field.value || ''}
									className="absolute opacity-0 pointer-events-none h-0 p-0 border-0"
								/>
								{field.value ? (
									<div
										className="text-sm py-2 whitespace-normal"
										style={{ wordBreak: 'break-word' }}
									>
										{field.value}
									</div>
								) : (
									<div className="text-sm text-muted-foreground py-2">
										Выберите точку на карте
									</div>
								)}
							</div>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<MapPinned className="h-4 w-4" />
						<span>Укажите адрес на карте</span>
						{isGeocoding && <span>· ищу адрес...</span>}
					</div>
					{hasApiKey && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onGetCurrentLocation}
							className="flex items-center gap-2"
						>
							<Navigation className="h-4 w-4" />
							Мое местоположение
						</Button>
					)}
				</div>
				<div className="overflow-hidden rounded-lg border h-72 w-full">
					{hasApiKey ? (
						<div ref={mapContainerRef} className="h-full w-full" />
					) : (
						<div className="h-full w-full flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
							<div>Укажите VITE_YANDEX_MAPS_API_KEY в файле .env</div>
							<div className="text-xs mt-2 text-center">
								<div>
									Значение:{' '}
									{rawKey
										? `"${String(rawKey).substring(0, 20)}..."`
										: 'undefined'}
								</div>
								<div>Тип: {typeof rawKey}</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
