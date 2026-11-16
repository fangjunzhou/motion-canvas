import {
  Rect,
  Txt,
  initial,
  nodeName,
  signal,
  type RectProps,
} from '@canvas-commons/2d';
import {
  all,
  sequence,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  type TimingFunction,
} from '@canvas-commons/core';
import {defaultTheme, type MotionTheme} from '../foundations/theme';
import {Card, type CardProps} from './Card';
import {Highlight, type HighlightProps} from './Highlight';

function tableTheme(node: Rect | Txt): MotionTheme {
  let parent = node.parent();
  while (parent) {
    if (parent instanceof Table) return parent.theme();
    parent = parent.parent();
  }
  return defaultTheme;
}

/** A themed table whose direct children are TableRow nodes. */
@nodeName('Table')
export class Table extends Card {
  public constructor(props: CardProps = {}) {
    super({padding: 0, gap: 0, lineWidth: 0, ...props});
  }

  /**
   * Fade in the surface and reveal rows in order over the supplied duration.
   * Keep the table at opacity zero when a parent enters before this method.
   * @example
   * ```ts
   * const table = new Table({opacity: 0, children: rows});
   * view.add(table);
   * yield* table.enter();
   * ```
   */
  public override *enter(
    duration = this.theme().motion.long,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    const rows = this.children().filter(
      (child): child is TableRow => child instanceof TableRow,
    );
    const states = rows.map(row => ({
      raw: row.opacity.context.raw(),
      opacity: row.opacity(),
    }));
    const rawOpacity = this.opacity.context.raw();
    const rowTime = rows.length ? duration * 0.8 : 0;
    const step = rowTime / Math.max(1, rows.length);
    let completed = false;
    this.opacity(0);
    for (const row of rows) row.opacity(0);
    try {
      yield* this.opacity(1, duration - rowTime, easing);
      yield* sequence(
        step,
        ...rows.map((row, index) =>
          row.opacity(states[index].opacity, step, easing),
        ),
      );
      completed = true;
    } finally {
      if (!completed) {
        if (rawOpacity === undefined) this.opacity.reset();
        else this.opacity(rawOpacity);
      }
      rows.forEach((row, index) => {
        const raw = states[index].raw;
        if (raw === undefined) row.opacity.reset();
        else row.opacity(raw);
      });
    }
  }

  /**
   * Reveal a column without changing its layout slot or the other columns.
   * @example
   * ```ts
   * yield* table().revealColumn(1);
   * ```
   */
  public *revealColumn(
    index: number,
    duration = this.theme().motion.medium,
    easing: TimingFunction = this.theme().motion.enter,
  ): ThreadGenerator {
    if (!Number.isInteger(index) || index < 0) {
      throw new RangeError('Column index must be a nonnegative integer.');
    }
    yield* all(
      ...this.children()
        .filter((child): child is TableRow => child instanceof TableRow)
        .flatMap(row =>
          row
            .children()
            .filter((child): child is TableCell => child instanceof TableCell)
            .slice(index, index + 1),
        )
        .map(cell => cell.opacity(1, duration, easing)),
    );
  }
}

export interface TableRowProps extends RectProps {
  header?: SignalValue<boolean>;
  highlighted?: SignalValue<boolean>;
}

/** A flex row; give corresponding cells the same grow weights in every row. */
@nodeName('TableRow')
export class TableRow extends Rect {
  @initial(false) @signal() declare public readonly header: SimpleSignal<
    boolean,
    this
  >;
  @initial(false) @signal() declare public readonly highlighted: SimpleSignal<
    boolean,
    this
  >;
  public constructor(props: TableRowProps = {}) {
    super({
      layout: true,
      direction: 'row',
      alignItems: 'center',
      shrink: 0,
      padding: () => [
        tableTheme(this).spacing.small,
        tableTheme(this).padding.medium,
      ],
      gap: () => tableTheme(this).spacing.medium,
      stroke: () =>
        this.highlighted()
          ? tableTheme(this).colors.accent
          : tableTheme(this).colors.border,
      lineWidth: 0,
      ...props,
    });
  }
  protected getDefaultFill(): string | null {
    return this.header()
      ? tableTheme(this).colors.mantle
      : this.highlighted()
        ? tableTheme(this).colors.surface1
        : null;
  }
}

/** Wrapping text with native rich-text children, alignment, and column weights. */
@nodeName('TableCell')
export class TableCell extends Highlight {
  public constructor(props: HighlightProps = {}) {
    super({
      theme: () => tableTheme(this),
      grow: 1,
      basis: 0,
      minWidth: 0,
      textWrap: true,
      fontFamily: () => tableTheme(this).typography.fontFamily,
      fontSize: () => tableTheme(this).typography.body,
      fill: () => tableTheme(this).colors.foreground,
      fontWeight: () => {
        const parent = this.parent();
        return parent instanceof TableRow && parent.header() ? 600 : 400;
      },
      ...props,
    });
  }
}
