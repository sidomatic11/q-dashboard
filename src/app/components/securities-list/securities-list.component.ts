import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
} from '@angular/material/table';
import { Observable, BehaviorSubject, switchMap } from 'rxjs';
import { indicate } from '../../utils';
import { Security } from '../../models/security';
import { SecurityService } from '../../services/security.service';
import { FilterableTableComponent } from '../filterable-table/filterable-table.component';
import { AsyncPipe } from '@angular/common';
import { SecuritiesFilter } from '../../models/securities-filter';
import { FilterFieldConfig } from '../../models/filter-field-config';

/** Filter config for SecuritiesFilter. Extensible: add new fields here when interface changes. */
const SECURITIES_FILTER_CONFIG: FilterFieldConfig[] = [
  { key: 'name', type: 'text', label: 'Name', placeholder: 'Search by name...' },
  {
    key: 'types',
    type: 'multi-select',
    label: 'Types',
    options: [
      { value: 'BankAccount', label: 'Bank Account' },
      { value: 'Closed-endFund', label: 'Closed-end Fund' },
      { value: 'Collectible', label: 'Collectible' },
      { value: 'DirectHolding', label: 'Direct Holding' },
      { value: 'Equity', label: 'Equity' },
      { value: 'Generic', label: 'Generic' },
      { value: 'Loan', label: 'Loan' },
      { value: 'RealEstate', label: 'Real Estate' },
    ],
  },
  {
    key: 'currencies',
    type: 'multi-select',
    label: 'Currencies',
    options: [
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
      { value: 'USD', label: 'USD' },
    ],
  },
  { key: 'isPrivate', type: 'boolean', label: 'Private only' },
  {
    key: 'limit',
    type: 'select',
    label: 'Page size',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
    ],
  },
];

@Component({
  selector: 'securities-list',
  standalone: true,
  imports: [
    FilterableTableComponent,
    AsyncPipe,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatNoDataRow,
    MatRowDef,
    MatRow,
  ],
  templateUrl: './securities-list.component.html',
  styleUrl: './securities-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecuritiesListComponent {
  protected displayedColumns: string[] = ['name', 'type', 'currency'];
  protected securitiesFilterConfig = SECURITIES_FILTER_CONFIG;

  private _securityService = inject(SecurityService);
  protected loadingSecurities$ = new BehaviorSubject<boolean>(false);

  private _filter$ = new BehaviorSubject<SecuritiesFilter>({});

  protected securities$: Observable<Security[]> = this._filter$.pipe(
    switchMap((filter) =>
      this._securityService
        .getSecurities(filter)
        .pipe(indicate(this.loadingSecurities$))
    )
  );

  protected onFilterChange(filter: Record<string, unknown>): void {
    const f: SecuritiesFilter = { ...filter } as SecuritiesFilter;
    if (typeof f.limit === 'string') {
      const parsed = parseInt(f.limit, 10);
      f.limit = Number.isNaN(parsed) ? 100 : parsed;
    }
    if (f.limit == null) f.limit = 100;
    f.skip = f.skip ?? 0;
    this._filter$.next(f);
  }
}
