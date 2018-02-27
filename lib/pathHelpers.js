const getMediaFiles = (text) => {
  const fileMatches = text.match(/(?:background-(?:image|video)="([^"]+)")|(?:!\[[^\]]*\] ?\(([^")]+\w)[^)]*\))/g);

  if (!fileMatches) return [];

  return fileMatches.map(match => match.replace(/^background-(?:image|video)="([^"]+)"/, '$1')).map(match => match.replace(/!\[[^\]]*\] ?\(([^")]+\w)[^)]*\)/, '$1'));
};

const replaceAbsoluteMediaPathWithRelativeInHtml = html =>
  html
  // .replace(/(background-(?:image|video)=")(?:[^"]*[\\/])?([\w% ]+\.\w+")/g, '$1media/$2')
    .replace(/(src=")(?:.*[\\/])?([\w% ]+\.\w+)/g, '$1media/$2');

const replaceAbsoluteMediaPathWithRelativeInMd = md => md.replace(/(!\[.*\]\().*[\\/]([^)]+\))/g, '$1media/$2');

const replaceRelativeMediaPathWithAbsoluteInMd = (md, absolutePath) => md.replace(/(!\[.*\]\()([^)]+\))/g, `$1${absolutePath}/$2`);

export { getMediaFiles, replaceAbsoluteMediaPathWithRelativeInHtml, replaceAbsoluteMediaPathWithRelativeInMd, replaceRelativeMediaPathWithAbsoluteInMd };
