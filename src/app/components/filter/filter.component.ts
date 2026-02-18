import { ChangeDetectionStrategy, Component, Input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { FilterFieldConfig, FilterFieldType } from '../../models/filter-field-config';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent {
  /** Filter field configuration. When empty, nothing is rendered. */
  @Input() set config(cfg: FilterFieldConfig[]) {
    this._config = cfg ?? [];
    this._buildForm();
  }
  get config(): FilterFieldConfig[] {
    return this._config;
  }
  private _config: FilterFieldConfig[] = [];

  filterChange = output<Record<string, unknown>>();

  form = signal<FormGroup | null>(null);

  /** Config for template iteration */
  protected get configFields(): FilterFieldConfig[] {
    return this._config;
  }

  constructor(private _fb: FormBuilder) {}

  private _buildForm(): void {
    const cfg = this._config;
    if (!cfg?.length) {
      this.form.set(null);
      return;
    }
    const group: Record<string, unknown> = {};
    for (const field of cfg) {
      switch (field.type) {
        case 'text':
          group[field.key] = '';
          break;
        case 'multi-select':
          group[field.key] = [];
          break;
        case 'select':
          group[field.key] = field.options?.[0]?.value ?? '';
          break;
        case 'boolean':
          group[field.key] = false;
          break;
      }
    }
    this.form.set(this._fb.group(group));
  }

  protected getForm(): FormGroup | null {
    return this.form();
  }

  protected isText(type: FilterFieldType): boolean {
    return type === 'text';
  }

  protected isMultiSelect(type: FilterFieldType): boolean {
    return type === 'multi-select';
  }

  protected isSelect(type: FilterFieldType): boolean {
    return type === 'select';
  }

  protected isBoolean(type: FilterFieldType): boolean {
    return type === 'boolean';
  }

  onFilterSubmit(): void {
    const f = this.form();
    if (!f) return;

    const raw = f.getRawValue();
    const filter: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (value === '' || value === null || value === undefined) {
        filter[key] = undefined;
      } else if (Array.isArray(value) && value.length === 0) {
        filter[key] = undefined;
      } else if (typeof value === 'boolean' && !value) {
        filter[key] = undefined;
      } else {
        filter[key] = value;
      }
    }

    this.filterChange.emit(filter);
  }
}
