import {Txt, makeScene2D} from '@canvas-commons/2d';
import {all, cancel, waitFor, type ThreadGenerator} from '@canvas-commons/core';
import example from '../../../motion-kit/examples/card';
import {Badge} from '../../../motion-kit/registry/components/Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardImage,
  CardTitle,
} from '../../../motion-kit/registry/components/Card';
import {
  createTheme,
  defaultTheme,
} from '../../../motion-kit/registry/foundations/theme';
import type {
  CardImageSample,
  CardMotionProbe,
  CardMotionSample,
} from './card-motion.probe';

const Published: {resolve: (probe: CardMotionProbe) => void} = {
  resolve: () => {},
};
window.cardMotionProbe = new Promise<CardMotionProbe>(resolve => {
  Published.resolve = resolve;
});

export default makeScene2D(function* (view) {
  const styled = new Card({
    width: 600,
    opacity: 0,
    children: [
      new CardHeader({children: new CardTitle({text: 'Theme defaults'})}),
      new CardContent({children: new Txt({text: 'Content'})}),
      new CardFooter({children: new Txt({text: 'Caption'})}),
    ],
  });
  const badge = new Badge({text: 'Status', opacity: 0});
  view.add([styled, badge]);
  const styles: CardMotionProbe['styles'] = {};
  function readStyle(node: Card): CardMotionProbe['styles'][string] {
    const header = node.children().find(child => child instanceof CardHeader);
    const title = header?.children().find(child => child instanceof CardTitle);
    const content = node.children().find(child => child instanceof CardContent);
    const body = content?.children().find(child => child instanceof Txt);
    const footer = node.children().find(child => child instanceof CardFooter);
    const caption = footer?.children().find(child => child instanceof Txt);
    if (!title || !content || !body || !footer || !caption) {
      throw new Error('Missing themed Card parts.');
    }
    return {
      padding: node.padding.top(),
      gap: node.rowGap(),
      contentPadding: content.padding.left(),
      footerPadding: footer.padding.left(),
      titleSize: title.fontSize(),
      bodySize: body.fontSize(),
      footerSize: caption.fontSize(),
      badgeSize: badge.fontSize(),
    };
  }
  styles.defaults = readStyle(styled);
  const copy = styled.clone();
  view.add(copy);
  const customTheme = createTheme({
    padding: {medium: 40, small: 12},
    spacing: {medium: 24, small: 8},
    typography: {title: 36, body: 26, caption: 18, label: 16},
  });
  copy.theme(customTheme);
  styles.clone = readStyle(copy);
  styles.original = readStyle(styled);
  styled.theme(customTheme);
  badge.theme(customTheme);
  styles.updated = readStyle(styled);
  styled.variant('sm');
  styles.compact = readStyle(styled);
  styled.spacing(10);
  styles.override = readStyle(styled);
  styled.spacing.reset();
  styles.reset = readStyle(styled);
  copy.gap(6);
  copy.padding.top(5);
  const copyContent = copy
    .children()
    .find(child => child instanceof CardContent);
  copyContent?.padding.left(7);
  copy.theme(defaultTheme);
  styles.native = readStyle(copy);
  for (const node of [styled, copy, badge]) {
    node.remove();
    node.dispose();
  }

  function snapshot(): CardMotionSample {
    const card = view.children().find(child => child instanceof Card);
    const header = card?.children().find(child => child instanceof CardHeader);
    const title = header?.children().find(child => child instanceof CardTitle);
    const description = header
      ?.children()
      .find(child => child instanceof CardDescription);
    const content = card
      ?.children()
      .find(child => child instanceof CardContent);
    const footer = card?.children().find(child => child instanceof CardFooter);
    if (!card || !title || !description || !content || !footer) {
      throw new Error('The Card example is missing a required part.');
    }
    return {
      width: card.width(),
      height: card.height(),
      title: title.text(),
      titleOpacity: title.opacity(),
      descriptionOpacity: description.opacity(),
      contentOpacity: content.opacity(),
      contentWidth: content.width(),
      footerVisible: footer.visible(),
      footerOpacity: footer.opacity(),
      footerText: footer
        .children()
        .filter(child => child instanceof Txt)
        .map(child => child.text())
        .join(''),
    };
  }

  const samples: CardMotionSample[] = [];
  let running = true;
  yield* all(
    (function* (): ThreadGenerator {
      yield* example.config(view);
      running = false;
    })(),
    (function* (): ThreadGenerator {
      while (running) {
        samples.push(snapshot());
        yield;
      }
      samples.push(snapshot());
    })(),
  );

  const card = view.children().find(child => child instanceof Card);
  if (!card) throw new Error('The Card example did not create a Card.');
  const originalHeight = card.height.context.raw();
  const independent = card.clone();
  independent.opacity(0);
  view.add(independent);

  yield* card.hideFooter(0);
  yield* card.hideFooter(0);
  const hiddenHeight = card.height();
  yield* card.enter(0);
  yield* card.changeText({title: 'Timing'}, 0);
  const zeroDuration = snapshot();
  yield* card.showFooter(0);
  const shownHeight = card.height();
  yield* card.showFooter(0);
  const repeatedFooterHeight = card.height() - shownHeight;
  yield* card.hideFooter(0);
  if (Math.abs(card.height() - hiddenHeight) > 1) {
    throw new Error('Footer transitions left layout space behind.');
  }
  const change: ThreadGenerator = yield card.changeText(
    {title: 'Cancelled', width: 1000},
    1,
  );
  yield* waitFor(0.4);
  cancel(change);
  yield* waitFor(0.1);
  const cancelled = snapshot();
  const originalImage =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="red"/></svg>',
    );
  const nextImage =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><rect width="80" height="120" fill="blue"/></svg>',
    );
  const cover = new CardImage({
    src: originalImage,
    height: 120,
    visible: false,
    fit: 'contain',
  });
  const body = new CardContent({
    children: new Txt({
      text: 'The cover changes without rebuilding this text.',
      textWrap: true,
    }),
  });
  const imageCard = new Card({width: 400, opacity: 0, children: [cover, body]});
  view.add(imageCard);
  const heightBinding = imageCard.height.context.raw();
  const images: CardImageSample[] = [];
  const imageSnapshot = (phase: string): CardImageSample => ({
    phase,
    height: imageCard.height(),
    width: imageCard.width(),
    contentWidth: body.width(),
    contentOpacity: body.opacity(),
    imageWidth: cover.width(),
    imageHeight: cover.height(),
    visible: cover.visible(),
    opacity: cover.opacity(),
    src: cover.src(),
    loaded: cover.opacity() <= 0 || cover.naturalSize().x > 0,
  });
  function* recordImage(
    phase: string,
    animation: ThreadGenerator,
  ): ThreadGenerator {
    let running = true;
    yield* all(
      (function* (): ThreadGenerator {
        yield* animation;
        running = false;
      })(),
      (function* (): ThreadGenerator {
        while (running) {
          images.push(imageSnapshot(phase));
          yield;
        }
        images.push(imageSnapshot(phase));
      })(),
    );
  }
  yield* recordImage('show', imageCard.showImage(0.6));
  yield* recordImage(
    'change',
    imageCard.changeImage({src: nextImage, width: 300, height: 300}, 0.8),
  );
  const imageClone = imageCard.clone();
  view.add(imageClone);
  yield* recordImage('hide', imageCard.hideImage(0.6));
  yield* recordImage(
    'hidden-change',
    imageCard.changeImage({src: originalImage, width: 400, height: 120}, 0.4),
  );
  yield* imageCard.hideImage(0);
  yield* imageCard.showImage(0);
  yield* imageCard.showImage(0);
  yield* imageCard.changeImage({src: nextImage, width: 300, height: 300}, 0);
  const imageZeroDuration = imageSnapshot('zero');
  const imageChange: ThreadGenerator = yield imageCard.changeImage(
    originalImage,
    1,
  );
  yield* waitFor(0.45);
  cancel(imageChange);
  yield* waitFor(0.1);
  const imageCancelled = imageSnapshot('cancelled');
  Published.resolve({
    styles,
    images,
    imageZeroDuration,
    imageCancelled,
    imageHeightRestored: imageCard.height.context.raw() === heightBinding,
    imageIndependent: imageClone
      .children()
      .some(
        child =>
          child instanceof CardImage &&
          child.src() === nextImage &&
          child.visible(),
      ),
    samples,
    zeroDuration,
    repeatedFooterHeight,
    restoredHeightBinding: card.height.context.raw() === originalHeight,
    cancelled,
    independent:
      independent.width() === 840 &&
      independent
        .children()
        .some(child => child instanceof CardFooter && child.visible()),
  });
  yield* waitFor(0.2);
});
