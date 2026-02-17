import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterComponent {
  filterChange = output<Record<string, unknown>>();

  onFilterSubmit(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterChange.emit({ name: value || undefined });
  }
  
}
