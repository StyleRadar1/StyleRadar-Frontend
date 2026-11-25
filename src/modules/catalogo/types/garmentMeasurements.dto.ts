export interface GarmentSizeMeasurementDto {
  size: string
  minChestCm?: number | null
  maxChestCm?: number | null
  minWaistCm?: number | null
  maxWaistCm?: number | null
  minHipCm?: number | null
  maxHipCm?: number | null
  lengthCm?: number | null
}

export interface GarmentSizeGuideResponseDto {
  garmentId: string
  isStoreDefined: boolean
  measurements: GarmentSizeMeasurementDto[]
}

export const REFERENCE_GARMENT_MEASUREMENTS: Record<string, Omit<GarmentSizeMeasurementDto, 'size'>> = {
  XS: { minChestCm: 80, maxChestCm: 86, minWaistCm: 64, maxWaistCm: 70, minHipCm: 84, maxHipCm: 90, lengthCm: 64 },
  S: { minChestCm: 86, maxChestCm: 92, minWaistCm: 70, maxWaistCm: 76, minHipCm: 90, maxHipCm: 96, lengthCm: 67 },
  M: { minChestCm: 92, maxChestCm: 98, minWaistCm: 76, maxWaistCm: 84, minHipCm: 96, maxHipCm: 102, lengthCm: 70 },
  L: { minChestCm: 98, maxChestCm: 106, minWaistCm: 84, maxWaistCm: 92, minHipCm: 102, maxHipCm: 110, lengthCm: 73 },
  XL: { minChestCm: 106, maxChestCm: 116, minWaistCm: 92, maxWaistCm: 102, minHipCm: 110, maxHipCm: 118, lengthCm: 76 },
  XXL: { minChestCm: 116, maxChestCm: 126, minWaistCm: 102, maxWaistCm: 112, minHipCm: 118, maxHipCm: 128, lengthCm: 79 },
  '26': { minChestCm: 78, maxChestCm: 84, minWaistCm: 64, maxWaistCm: 69, minHipCm: 86, maxHipCm: 92, lengthCm: 98 },
  '28': { minChestCm: 82, maxChestCm: 88, minWaistCm: 69, maxWaistCm: 74, minHipCm: 91, maxHipCm: 96, lengthCm: 100 },
  '30': { minChestCm: 88, maxChestCm: 94, minWaistCm: 75, maxWaistCm: 80, minHipCm: 96, maxHipCm: 101, lengthCm: 102 },
  '32': { minChestCm: 94, maxChestCm: 100, minWaistCm: 81, maxWaistCm: 86, minHipCm: 101, maxHipCm: 106, lengthCm: 104 },
  '34': { minChestCm: 100, maxChestCm: 108, minWaistCm: 87, maxWaistCm: 93, minHipCm: 106, maxHipCm: 112, lengthCm: 105 },
  '36': { minChestCm: 108, maxChestCm: 116, minWaistCm: 94, maxWaistCm: 100, minHipCm: 112, maxHipCm: 118, lengthCm: 106 },
}

export function normalizeMeasurementsPayload(raw: unknown): GarmentSizeMeasurementDto[] {
  if (!raw) return []
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'object' && raw !== null && Array.isArray((raw as Record<string, unknown>).measurements)
      ? ((raw as Record<string, unknown>).measurements as unknown[])
      : typeof raw === 'object' && raw !== null && Array.isArray((raw as Record<string, unknown>).sizes)
        ? ((raw as Record<string, unknown>).sizes as unknown[])
        : []

  return list
    .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    .map((row) => ({
      size: String(row.size ?? row.talla ?? ''),
      minChestCm: typeof row.minChestCm === 'number' ? row.minChestCm : undefined,
      maxChestCm: typeof row.maxChestCm === 'number' ? row.maxChestCm : undefined,
      minWaistCm: typeof row.minWaistCm === 'number' ? row.minWaistCm : undefined,
      maxWaistCm: typeof row.maxWaistCm === 'number' ? row.maxWaistCm : undefined,
      minHipCm: typeof row.minHipCm === 'number' ? row.minHipCm : undefined,
      maxHipCm: typeof row.maxHipCm === 'number' ? row.maxHipCm : undefined,
      lengthCm: typeof row.lengthCm === 'number' ? row.lengthCm : undefined,
    }))
    .filter((row) => row.size.length > 0)
}
