import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { interval } from 'rxjs';

interface TransactionRow {
  date: string;
  description: string;
  price: string;
  location: string;
  type: 'auction' | 'private' | 'appraisal';
  typeLabel: string;
  change: string;
  changeClass: string;
}

@Component({
  selector: 'app-task3',
  standalone: true,
  imports: [MatIconModule, DatePipe],
  templateUrl: './task3.component.html',
  styleUrl: './task3.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Task3Component implements AfterViewInit {
  @ViewChild('mainChart') mainChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart') donutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scatterChart') scatterChartRef!: ElementRef<HTMLCanvasElement>;

  currentSlide = 0;
  readonly carouselDots = [0, 1, 2, 3];
  readonly totalSlides = 4;
  /** Carousel images from public folder — 4:3 aspect ratio */
  readonly carouselImages = [
    { src: '/1.webp', alt: 'Slide 1' },
    { src: '/2.webp', alt: 'Slide 2' },
    { src: '/3.webp', alt: 'Slide 3' },
    { src: '/4.webp', alt: 'Slide 4' },
  ];
  /** Static timestamp for when data was last updated (Feb 19, 2026 14:32 UTC) */
  readonly lastUpdated = 1739968320000;

  /** Direct valuations of chassis 57591 — auction results and appraisals (chronological) */
  readonly valuationEvents: {
    date: string;
    value: number;
    type: 'auction' | 'appraisal';
    description: string;
    location: string;
  }[] = [
    {
      date: 'Mar 2018',
      value: 31.2,
      type: 'auction',
      description: 'Acquisition at RM Sotheby\'s Amelia Island',
      location: 'Amelia Island, FL',
    },
    {
      date: 'Jun 2021',
      value: 33.3,
      type: 'appraisal',
      description: 'COVID-era adjusted appraisal',
      location: 'Online / Remote',
    },
    {
      date: 'Feb 2023',
      value: 35.0,
      type: 'appraisal',
      description: 'Interim appraisal post-restoration check',
      location: 'Pebble Beach, CA',
    },
    {
      date: 'Mar 2024',
      value: 40.8,
      type: 'appraisal',
      description: 'Annual independent valuation',
      location: 'New York, NY',
    },
    {
      date: 'Jan 2025',
      value: 43.3,
      type: 'appraisal',
      description: 'Scheduled quarterly appraisal',
      location: 'Pebble Beach, CA',
    },
    {
      date: 'Feb 2026',
      value: 47.5,
      type: 'appraisal',
      description: 'Professional appraisal, FIVA renewal',
      location: 'Pebble Beach, CA',
    },
  ];

  /** Comparable sales for scatter: x = year.fraction, y = $M, chassis, description, isOwnAsset */
  readonly comparableSalesScatter: {
    x: number;
    y: number;
    chassis: string;
    description: string;
    isOwnAsset: boolean;
  }[] = [
    { x: 2018.25, y: 31.2, chassis: '57591', description: 'Acquisition at RM Sotheby\'s Amelia Island', isOwnAsset: true },
    { x: 2018.75, y: 32.8, chassis: '57596', description: 'RM Sotheby\'s Monterey auction', isOwnAsset: false },
    { x: 2019.5, y: 34.1, chassis: '57597', description: 'Private treaty sale', isOwnAsset: false },
    { x: 2020.17, y: 33.5, chassis: '57598', description: 'Gooding & Company, Pebble Beach', isOwnAsset: false },
    { x: 2020.83, y: 32.2, chassis: '57599', description: 'Bonhams Quail Lodge sale', isOwnAsset: false },
    { x: 2021.5, y: 33.3, chassis: '57591', description: 'COVID-era adjusted appraisal', isOwnAsset: true },
    { x: 2022.25, y: 36.8, chassis: '57600', description: 'RM Sotheby\'s Amelia Island', isOwnAsset: false },
    { x: 2022.75, y: 37.5, chassis: '57601', description: 'Private treaty sale, Geneva', isOwnAsset: false },
    { x: 2023.17, y: 35.0, chassis: '57591', description: 'Interim appraisal post-restoration check', isOwnAsset: true },
    { x: 2023.5, y: 38.2, chassis: '57602', description: 'Bonhams Festival of Speed', isOwnAsset: false },
    { x: 2023.83, y: 38.9, chassis: '57595', description: 'Bonhams Paris Rétromobile sale', isOwnAsset: false },
    { x: 2024.25, y: 40.8, chassis: '57591', description: 'Annual independent valuation', isOwnAsset: true },
    { x: 2024.75, y: 44.2, chassis: '57594', description: 'Gooding & Company, Pebble Beach', isOwnAsset: false },
    { x: 2025.08, y: 43.3, chassis: '57591', description: 'Scheduled quarterly appraisal', isOwnAsset: true },
    { x: 2025.5, y: 42.4, chassis: '57593', description: 'RM Sotheby\'s Monaco auction', isOwnAsset: false },
    { x: 2025.92, y: 45.0, chassis: '57592', description: 'Private treaty sale, Geneva', isOwnAsset: false },
    { x: 2026.17, y: 47.5, chassis: '57591', description: 'Professional appraisal, FIVA renewal', isOwnAsset: true },
    { x: 2026.25, y: 44.8, chassis: '57603', description: 'RM Sotheby\'s Amelia Island', isOwnAsset: false },
  ];

  readonly transactions: TransactionRow[] = [
    {
      date: 'Feb 2026',
      description: 'Chassis 57591 — Professional appraisal, FIVA renewal',
      price: '$47,500,000',
      location: 'Pebble Beach, CA',
      type: 'appraisal',
      typeLabel: 'Appraisal',
      change: '▲ +9.7%',
      changeClass: 'up',
    },
    {
      date: 'Nov 2025',
      description: 'Chassis 57592 — Private treaty sale, comparable spec',
      price: '$45,000,000',
      location: 'Geneva, Switzerland',
      type: 'private',
      typeLabel: 'Private',
      change: '▲ +6.2%',
      changeClass: 'up',
    },
    {
      date: 'Jun 2025',
      description: "Chassis 57593 — RM Sotheby's Monaco auction",
      price: '$42,400,000',
      location: 'Monaco GP Week',
      type: 'auction',
      typeLabel: 'Auction',
      change: '▲ +3.4%',
      changeClass: 'up',
    },
    {
      date: 'Jan 2025',
      description: 'Chassis 57591 — Scheduled quarterly appraisal',
      price: '$43,300,000',
      location: 'Pebble Beach, CA',
      type: 'appraisal',
      typeLabel: 'Appraisal',
      change: '▼ −2.1%',
      changeClass: 'down',
    },
    {
      date: 'Sep 2024',
      description: 'Chassis 57594 — Gooding & Company, Pebble Beach',
      price: '$44,200,000',
      location: 'Pebble Beach, CA',
      type: 'auction',
      typeLabel: 'Auction',
      change: '▲ +8.3%',
      changeClass: 'up',
    },
    {
      date: 'Mar 2024',
      description: 'Chassis 57591 — Annual independent valuation',
      price: '$40,800,000',
      location: 'New York, NY',
      type: 'appraisal',
      typeLabel: 'Appraisal',
      change: '▲ +4.9%',
      changeClass: 'up',
    },
    {
      date: 'Oct 2023',
      description: 'Chassis 57595 — Bonhams Paris Rétromobile sale',
      price: '$38,900,000',
      location: 'Paris, France',
      type: 'auction',
      typeLabel: 'Auction',
      change: '▲ +11.2%',
      changeClass: 'up',
    },
    {
      date: 'Feb 2023',
      description: 'Chassis 57591 — Interim appraisal post-restoration check',
      price: '$35,000,000',
      location: 'Pebble Beach, CA',
      type: 'appraisal',
      typeLabel: 'Appraisal',
      change: '▲ +5.1%',
      changeClass: 'up',
    },
    {
      date: 'Jun 2021',
      description: 'Chassis 57591 — COVID-era adjusted appraisal',
      price: '$33,300,000',
      location: 'Online / Remote',
      type: 'appraisal',
      typeLabel: 'Appraisal',
      change: '▼ −1.8%',
      changeClass: 'down',
    },
    {
      date: 'Mar 2018',
      description: "Chassis 57591 — Acquisition at RM Sotheby's Amelia Island",
      price: '$31,200,000',
      location: 'Amelia Island, FL',
      type: 'auction',
      typeLabel: 'Auction',
      change: '— Initial',
      changeClass: '',
    },
  ];

  private mainChart: Chart | null = null;
  private barChart: Chart | null = null;
  private donutChart: Chart | null = null;
  private scatterChart: Chart | null = null;

  constructor(
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    this.initCharts();
    this.startCarouselAutoAdvance();
  }

  goSlide(n: number): void {
    this.currentSlide = n;
    this.cdr.markForCheck();
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.cdr.markForCheck();
  }

  prevSlide(): void {
    this.currentSlide =
      (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.cdr.markForCheck();
  }

  private startCarouselAutoAdvance(): void {
    interval(6000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.nextSlide());
  }

  private initCharts(): void {
    this.initMainChart();
    this.initBarChart();
    this.initDonutChart();
    this.initScatterChart();
  }

  private initMainChart(): void {
    const ctx = this.mainChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const events = this.valuationEvents;
    const gold = '#c9a84c';
    const border = '#2e2e38';

    // Hagerty Blue Chip Index (100 base Mar 2018), scaled to $M for overlay
    const indexBase = 31.2;
    const indexValues = [100, 103, 106, 111, 116, 120].map((v) => (v / 100) * indexBase);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: events.map((e) => e.date),
        datasets: [
          {
            label: 'Asset Value',
            data: events.map((e) => e.value),
            borderColor: gold,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointBackgroundColor: gold,
            pointRadius: 6,
            pointHoverRadius: 10,
            pointStyle: (ctx) => (events[ctx.dataIndex]?.type === 'auction' ? 'circle' : 'rect'),
            fill: false,
            tension: 0.3,
            spanGaps: false,
          },
          {
            label: 'Hagerty Blue Chip Index',
            data: indexValues,
            borderColor: '#7878c0',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 2,
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 24,
              boxHeight: 2,
              color: '#5a5550',
              padding: 20,
              font: { size: 10, family: "'DM Mono', monospace" },
            },
          },
          tooltip: {
            backgroundColor: '#141416',
            borderColor: border,
            borderWidth: 1,
            titleColor: gold,
            bodyColor: '#9a9088',
            padding: 12,
            callbacks: {
              title: (tooltipItems: { dataIndex: number; datasetIndex: number }[]) => {
                const item = tooltipItems.find((i) => i.datasetIndex === 0) ?? tooltipItems[0];
                return item ? events[item.dataIndex]?.date ?? '' : '';
              },
              label: (ctx) => {
                if (ctx.datasetIndex === 1) {
                  return `  $${(ctx.parsed as { y: number }).y.toFixed(1)}M (index)`;
                }
                const ev = events[ctx.dataIndex];
                const typeLabel = ev?.type === 'auction' ? 'Auction' : 'Appraisal';
                return `  $${(ctx.parsed as { y: number }).y.toFixed(1)}M · ${typeLabel}`;
              },
              afterBody: (tooltipItems: { dataIndex: number; datasetIndex: number }[]) => {
                const item = tooltipItems.find((i) => i.datasetIndex === 0);
                if (!item) return [];
                const ev = events[item.dataIndex];
                if (!ev) return [];
                return ['', ev.description, ev.location];
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(46,46,56,0.5)', drawTicks: false },
            border: { dash: [4, 4] },
            ticks: { color: '#8a8a98', maxRotation: 0 },
          },
          y: {
            grid: { color: 'rgba(46,46,56,0.5)', drawTicks: false },
            border: { display: false },
            ticks: {
              color: '#8a8a98',
              callback: (v) => `$${v}M`,
            },
            min: 28,
            max: 52,
          },
        },
      },
    };

    this.mainChart = new Chart(ctx, config);
  }

  private initBarChart(): void {
    const ctx = this.barChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const gold = '#c9a84c';
    const border = '#2e2e38';

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
        datasets: [
          {
            label: 'Asset',
            data: [2.6, 4.7, -0.6, 1.5, 7.5, 8.5, 9.9, 9.7],
            backgroundColor: (ctx) =>
              (ctx.raw as number) >= 0
                ? 'rgba(201,168,76,0.7)'
                : 'rgba(224,85,85,0.7)',
            borderRadius: 2,
            borderSkipped: false,
          },
          {
            label: 'Index',
            data: [1.0, 3.0, -1.5, 2.0, 4.5, 5.0, 6.0, 5.5],
            backgroundColor: 'rgba(120,120,192,0.35)',
            borderRadius: 2,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 16,
              boxHeight: 2,
              color: '#5a5550',
              padding: 12,
              font: { size: 9 },
            },
          },
          tooltip: {
            backgroundColor: '#141416',
            borderColor: border,
            borderWidth: 1,
            titleColor: gold,
            bodyColor: '#9a9088',
            padding: 10,
            callbacks: {
              label: (ctx) =>
                `  ${(ctx.parsed as { y: number }).y > 0 ? '+' : ''}${(ctx.parsed as { y: number }).y}%`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8a8a98' } },
          y: {
            grid: { color: 'rgba(46,46,56,0.5)' },
            border: { display: false },
            ticks: { color: '#8a8a98', callback: (v) => `${v}%` },
          },
        },
      },
    };

    this.barChart = new Chart(ctx, config);
  }

  private initDonutChart(): void {
    const ctx = this.donutChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const gold = '#c9a84c';
    const border = '#2e2e38';

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: [
          'Vintage Automobiles',
          'Fine Art',
          'Classic Watches',
          'Wine & Spirits',
          'Other Collectibles',
        ],
        datasets: [
          {
            data: [38.4, 26.1, 18.2, 10.5, 6.8],
            backgroundColor: [
              'rgba(201,168,76,0.85)',
              'rgba(120,120,192,0.7)',
              'rgba(61,186,122,0.65)',
              'rgba(224,140,85,0.6)',
              'rgba(90,85,80,0.5)',
            ],
            borderColor: '#0a0a0b',
            borderWidth: 3,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#5a5550',
              padding: 10,
              font: { size: 9, family: "'DM Mono', monospace" },
              boxWidth: 10,
              boxHeight: 10,
            },
          },
          tooltip: {
            backgroundColor: '#141416',
            borderColor: border,
            borderWidth: 1,
            titleColor: gold,
            bodyColor: '#9a9088',
            padding: 10,
            callbacks: {
              label: (ctx) => `  ${ctx.parsed}%`,
            },
          },
        },
      },
    };

    this.donutChart = new Chart(ctx, config);
  }

  private initScatterChart(): void {
    const ctx = this.scatterChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const scatterData = this.comparableSalesScatter;
    const gold = '#c9a84c';
    const border = '#2e2e38';

    const peerPoints = scatterData.filter((d) => !d.isOwnAsset).map((d) => ({ x: d.x, y: d.y }));
    const ownPoints = scatterData.filter((d) => d.isOwnAsset).map((d) => ({ x: d.x, y: d.y }));

    const config: ChartConfiguration<'scatter'> = {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Comparable sales',
            data: peerPoints,
            pointRadius: 5,
            pointBackgroundColor: 'rgba(120,120,192,0.6)',
            pointBorderColor: '#7878c0',
            pointBorderWidth: 1,
          },
          {
            label: 'Your asset',
            data: ownPoints,
            pointRadius: 8,
            pointBackgroundColor: gold,
            pointBorderColor: gold,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 24,
              boxHeight: 2,
              color: '#5a5550',
              padding: 12,
              font: { size: 10, family: "'DM Mono', monospace" },
            },
          },
          tooltip: {
            backgroundColor: '#141416',
            borderColor: border,
            borderWidth: 1,
            titleColor: gold,
            bodyColor: '#9a9088',
            padding: 12,
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex;
                const datasetIdx = items[0]?.datasetIndex;
                const pts = datasetIdx === 0
                  ? scatterData.filter((d) => !d.isOwnAsset)
                  : scatterData.filter((d) => d.isOwnAsset);
                const d = pts[idx];
                return d ? `Chassis ${d.chassis} · ${d.isOwnAsset ? 'Your asset' : 'Comparable sale'}` : '';
              },
              label: (ctx) => {
                const idx = ctx.dataIndex;
                const datasetIdx = ctx.datasetIndex;
                const pts = datasetIdx === 0
                  ? scatterData.filter((d) => !d.isOwnAsset)
                  : scatterData.filter((d) => d.isOwnAsset);
                const d = pts[idx];
                if (!d) return '';
                return [`$${d.y.toFixed(1)}M`, d.description];
              },
            },
          },
        },
        scales: {
          x: {
            min: 2017.5,
            max: 2026.5,
            grid: { color: 'rgba(46,46,56,0.5)' },
            ticks: {
              color: '#8a8a98',
              stepSize: 1,
              maxTicksLimit: 10,
              callback: (value) => {
                const n = typeof value === 'string' ? parseFloat(value) : value;
                return typeof n === 'number' && !Number.isNaN(n) ? String(Math.round(n)) : '';
              },
            },
          },
          y: {
            min: 28,
            max: 52,
            grid: { color: 'rgba(46,46,56,0.5)' },
            ticks: {
              color: '#8a8a98',
              callback: (v) => `$${v}M`,
            },
          },
        },
      },
    };

    this.scatterChart = new Chart(ctx, config);
  }
}
