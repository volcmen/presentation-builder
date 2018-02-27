function pad(value, text, start, end) {
  let padValue = value;

  if (text[end] !== ' ')
    padValue = `${padValue} `;

  if (text[start] !== ' ')
    padValue = ` ${padValue}`;


  return padValue;
}

/**
 * @param {options.text} text where the value is to be inserted
 * @param {options.selectionStart} selectionStart
 * @param {options.selectionEnd} selectionEnd
 * @returns
 */
export function getCurrentEditLine(options) {
  const caretPos = options.selectionStart;
  let start;
  let end;

  for (start = caretPos - 1; start >= 0 && options.text[start - 1] != '\n'; --start);
  for (end = caretPos; end < options.text.length && options.text[end] != '\n'; ++end);

  return {
    start,
    end,
    text: options.text.substring(start, end),
  };
}

/**
 * @param {options.value} value to insert
 * @param {options.text} text where the value is to be inserted
 * @param {options.selectionStart} selectionStart
 * @param {options.selectionEnd} selectionEnd
 * @param {options.pattern} pattern to match text to replace
 * @returns
 */
function replace(options) {
  const line = getCurrentEditLine(options);
  const re = new RegExp(options.pattern);
  let newLine;

  if (line.text.match(re))
    newLine = line.text.replace(re, options.value);
	 else
    newLine = line.text + pad(options.value, line.text, line.text.length - 1, line.text.length - 1);


  return {
    start: line.start,
    end: line.end,
    text: newLine,
  };
}


/**
 * @param {options.value} value to insert
 * @param {options.text} text where the value is to be inserted
 * @param {options.selectionStart} selectionStart
 * @param {options.selectionEnd} selectionEnd
 * @param {options.pattern} pattern to match text to replace
 * @returns
 */
export function insertReplaceAtCursor(options) {
  const value = options.value;
  let finalText = options.text || '';
  const text = options.text || '';
  const selectionEnd = options.selectionEnd;
  let finalSelectionEnd = selectionEnd;
  const selectionStart = options.selectionStart;
  let finalSelectionStart = selectionStart;
  const pattern = options.pattern;

  if (selectionStart || selectionStart == '0') {
    let start;
    let end;
    let valueToInsert;
    options.value = options.value ? options.value.trim() : '';
    let finalPosition;

    if (pattern) {
      const line = replace(options);
      start = line.start;
      end = line.end;
      valueToInsert = line.text;
    } else {
      start = selectionStart;
      end = selectionEnd;
      valueToInsert = value.match(/:::slide|````/) ? value : pad(value, text, start - 1, end);
    }

    finalText = text.substring(0, start) + valueToInsert + text.substring(end, text.length);

    finalPosition = valueToInsert.match(/::::?slide|````/) ? start + valueToInsert.match(/::::?slide[^\n]*(\n|$)|````\n/)[0].length : start + valueToInsert.length;
    finalSelectionStart = finalSelectionEnd = finalPosition;
  } else
    finalText += value;


  return {
    text: finalText,
    selectionEnd: finalSelectionEnd,
    selectionStart: finalSelectionStart,
  };
}

export function getCurrentSlideBgSettingsFromEditor(editorData) {
  const currentLine = getCurrentEditLine(editorData).text;
  const currentSettings = {};

  if (currentLine.match(/^:+slide/)) {
    const currentSlideAttr = currentLine
      .replace(/^:+slide */, '')
      .trim()
      .replace(/" /g, '"!')
      .split('!')
      .filter(item => item.match(/^background-[^=]+="[^"]+"/));
    if (currentSlideAttr.length)
      currentSlideAttr
        .forEach((item) => {
          const itemBits = item.split('=');

          currentSettings[itemBits[0]] = itemBits[1].replace(/"/g, '');
        });
  }

  return currentSettings;
}
