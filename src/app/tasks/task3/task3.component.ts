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
  }

  private initMainChart(): void {
    const ctx = this.mainChartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    const gold = '#c9a84c';
    const border = '#2e2e38';
    const gradMain = ctx.createLinearGradient(0, 0, 0, 280);
    gradMain.addColorStop(0, 'rgba(201,168,76,0.25)');
    gradMain.addColorStop(1, 'rgba(201,168,76,0)');
    const gradIdx = ctx.createLinearGradient(0, 0, 0, 280);
    gradIdx.addColorStop(0, 'rgba(120,120,192,0.12)');
    gradIdx.addColorStop(1, 'rgba(120,120,192,0)');

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: [
          "Q1'18", "Q3'18", "Q1'19", "Q3'19", "Q1'20", "Q3'20", "Q1'21", "Q3'21",
          "Q1'22", "Q3'22", "Q1'23", "Q3'23", "Q1'24", "Q3'24", "Q1'25", "Q3'25",
          "Q1'26",
        ],
        datasets: [
          {
            label: 'Asset Value',
            data: [
              31.2, 32.0, 33.5, 34.2, 33.8, 33.0, 33.3, 34.8, 35.5, 36.2, 35.0,
              37.5, 38.8, 40.2, 42.1, 44.8, 47.5,
            ],
            borderColor: gold,
            backgroundColor: gradMain,
            borderWidth: 2,
            pointBackgroundColor: gold,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Vintage Auto Index',
            data: [100, 101, 103, 104, 102, 101, 103, 105, 107, 108, 106, 109, 111, 113, 112, 115, 117].map(
              (v) => v * 0.31
            ),
            borderColor: '#7878c0',
            backgroundColor: gradIdx,
            borderWidth: 1.5,
            borderDash: [5, 4],
            pointRadius: 2,
            fill: true,
            tension: 0.4,
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
              label: (ctx) => `  $${(ctx.parsed as { y: number }).y.toFixed(1)}M`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(46,46,56,0.5)', drawTicks: false },
            border: { dash: [4, 4] },
            ticks: { color: '#3a3a48', maxRotation: 0 },
          },
          y: {
            grid: { color: 'rgba(46,46,56,0.5)', drawTicks: false },
            border: { display: false },
            ticks: {
              color: '#3a3a48',
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
          x: { grid: { display: false }, ticks: { color: '#3a3a48' } },
          y: {
            grid: { color: 'rgba(46,46,56,0.5)' },
            border: { display: false },
            ticks: { color: '#3a3a48', callback: (v) => `${v}%` },
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
}
