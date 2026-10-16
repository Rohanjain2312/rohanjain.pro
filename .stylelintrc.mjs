// Stylelint config. Enforces the design token rules (docs/spec/07-design.md) and motion limit.
// Every project rule message starts with its rule ID (docs/rules.md).
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const NAMED_COLORS =
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(
    ' ',
  );

const COLOR_PROPS =
  /^(color|background|background-color|border(-[a-z]+)*|outline|outline-color|fill|stroke|stop-color|caret-color|accent-color|text-decoration|text-decoration-color|column-rule|column-rule-color|--.*)$/;
const MOTION_PROPS =
  /^(transition|transition-duration|transition-delay|animation|animation-duration|animation-delay|--.*(dur|delay|transition|animation|motion).*)$/;

const namedColor = new RegExp(`(?<![\\w-])(${NAMED_COLORS.join('|')})(?![\\w-])`, 'i');
// Any duration above 200 ms, written in s or ms.
const longDuration =
  /(?<![\d.])(?:0?\.(?:2\d*[1-9]|[3-9]\d*)|[1-9]\d*(?:\.\d+)?)s\b|(?<![\d.])(?:20[1-9]|2[1-9]\d|[3-9]\d\d|\d{4,}|200\.\d*[1-9])(?:\.\d+)?ms\b/;

const message = (prop, value) =>
  MOTION_PROPS.test(prop)
    ? `R-608: motion must be 200 ms or less ("${prop}: ${value}").`
    : `R-601: colors come only from tokens; use var(--token), not a named color ("${prop}: ${value}").`;

export default {
  extends: [require.resolve('stylelint-config-standard')],
  overrides: [
    { files: ['**/*.astro', '**/*.html'], customSyntax: 'postcss-html' },
    // The token file is the one place hex values are defined (docs/spec/07-design.md §7.2).
    { files: ['**/tokens.css', '**/tokens/**/*.css'], rules: { 'color-no-hex': null } },
  ],
  rules: {
    // R-601: colors only from tokens. Hex values live in the token file only (see overrides).
    'color-no-hex': [
      true,
      { message: 'R-601: colors come only from tokens; use var(--token), not a hex value.' },
    ],
    'function-disallowed-list': [
      [
        'rgb',
        'rgba',
        'hsl',
        'hsla',
        'hwb',
        'lab',
        'lch',
        'oklab',
        'oklch',
        'color',
        'color-mix',
        '/gradient$/',
        'drop-shadow',
      ],
      {
        message: (name) =>
          /gradient|drop-shadow/.test(name)
            ? `R-601: gradients and shadows are banned ("${name}()").`
            : `R-601: colors come only from tokens; use var(--token), not ${name}().`,
      },
    ],
    'property-disallowed-list': [
      ['box-shadow', 'text-shadow'],
      { message: (name) => `R-601: shadows are banned ("${name}").` },
    ],
    'declaration-property-value-disallowed-list': [
      {
        [COLOR_PROPS.toString()]: [namedColor],
        [MOTION_PROPS.toString()]: [longDuration],
      },
      { message },
    ],
    // Plain, predictable CSS; the standard config's stylistic picks that fight the token names are relaxed.
    'custom-property-pattern': null,
    'selector-class-pattern': null,
    'keyframes-name-pattern': null,
  },
};
