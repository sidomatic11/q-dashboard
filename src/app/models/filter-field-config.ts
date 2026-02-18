/**
 * Generic filter field configuration.
 * Enables the filter bar to render any filter shape without knowing the domain model.
 */
export type FilterFieldType = 'text' | 'multi-select' | 'select' | 'boolean';

export interface FilterFieldOption {
  value: string;
  label: string;
}

export interface FilterFieldConfig {
  key: string;
  type: FilterFieldType;
  label?: string;
  placeholder?: string;
  /** Options for multi-select fields */
  options?: FilterFieldOption[];
}
