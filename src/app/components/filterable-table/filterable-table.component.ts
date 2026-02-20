import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  Input,
  Output,
  EventEmitter,
  QueryList,
  ViewChild,
} from '@angular/core';
import { FilterFieldConfig } from '../../models/filter-field-config';
import { Observable } from 'rxjs';
import {
  MatColumnDef,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { DataSource } from '@angular/cdk/collections';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FilterComponent } from '../filter/filter.component';

@Component({
  selector: 'filterable-table',
  standalone: true,
  imports: [MatProgressSpinner, MatTable, MatButtonModule, FilterComponent],
  templateUrl: './filterable-table.component.html',
  styleUrl: './filterable-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterableTableComponent<T> implements AfterContentInit {
  @ContentChildren(MatHeaderRowDef) headerRowDefs?: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs?: QueryList<MatRowDef<T>>;
  @ContentChildren(MatColumnDef) columnDefs?: QueryList<MatColumnDef>;
  @ContentChild(MatNoDataRow) noDataRow?: MatNoDataRow;

  @ViewChild(MatTable, { static: true }) table?: MatTable<T>;

  @Input() columns: string[] = [];

  @Input() dataSource:
    | readonly T[]
    | DataSource<T>
    | Observable<readonly T[]>
    | null = null;
  @Input() isLoading: boolean | null = false;

  /** Filter field configuration passed through to the filter bar */
  @Input() filterConfig: FilterFieldConfig[] = [];

  /** Whether to show the Load more button. When false, button is hidden. */
  @Input() canLoadMore: boolean | null = false;

  @Output() filterChange = new EventEmitter<Record<string, unknown>>();
  @Output() loadMore = new EventEmitter<void>();

  public ngAfterContentInit(): void {
    this.columnDefs?.forEach((columnDef) =>
      this.table?.addColumnDef(columnDef)
    );
    this.rowDefs?.forEach((rowDef) => this.table?.addRowDef(rowDef));
    this.headerRowDefs?.forEach((headerRowDef) =>
      this.table?.addHeaderRowDef(headerRowDef)
    );
    this.table?.setNoDataRow(this.noDataRow ?? null);
  }
}
