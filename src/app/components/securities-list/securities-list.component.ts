import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
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
import { Observable, BehaviorSubject } from 'rxjs';
import { indicate } from '../../utils';
import { Security } from '../../models/security';
import { SecurityService } from '../../services/security.service';
import { FilterableTableComponent } from '../filterable-table/filterable-table.component';
import { AsyncPipe } from '@angular/common';
import { SecuritiesFilter } from '../../models/securities-filter';
import { FilterFieldConfig } from '../../models/filter-field-config';

/** Fixed page size. Service expects limit as end index (skip + PAGE_SIZE). */
const PAGE_SIZE = 10;

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
export class SecuritiesListComponent implements OnInit {
  protected displayedColumns: string[] = ['name', 'type', 'currency'];
  protected securitiesFilterConfig = SECURITIES_FILTER_CONFIG;

  private _securityService = inject(SecurityService);
  protected loadingSecurities$ = new BehaviorSubject<boolean>(false);

  private _criteria$ = new BehaviorSubject<SecuritiesFilter>({});
  private _accumulated$ = new BehaviorSubject<Security[]>([]);
  private _canLoadMore$ = new BehaviorSubject<boolean>(true);

  protected securities$: Observable<Security[]> = this._accumulated$.asObservable();
  protected canLoadMore$ = this._canLoadMore$.asObservable();

  ngOnInit(): void {
    this._fetchPage(0, false);
  }

  protected onFilterChange(filter: Record<string, unknown>): void {
    this._criteria$.next({ ...filter } as SecuritiesFilter);
    this._accumulated$.next([]);
    this._canLoadMore$.next(true);
    this._fetchPage(0, false);
  }

  protected onLoadMore(): void {
    this._fetchPage(this._accumulated$.getValue().length, true);
  }

  private _fetchPage(skip: number, append: boolean): void {
    const criteria = this._criteria$.getValue();
    const filter: SecuritiesFilter = {
      ...criteria,
      skip,
      limit: skip + PAGE_SIZE,
    };

    this._securityService
      .getSecurities(filter)
      .pipe(indicate(this.loadingSecurities$))
      .subscribe({
        next: (items) => {
          if (append) {
            const current = this._accumulated$.getValue();
            this._accumulated$.next([...current, ...items]);
          } else {
            this._accumulated$.next(items);
          }
          this._canLoadMore$.next(items.length >= PAGE_SIZE);
        },
      });
  }
}
