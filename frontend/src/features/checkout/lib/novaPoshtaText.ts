const WORD_START: Record<string, string> = {
  є: 'ye',
  ї: 'yi',
  й: 'y',
  ю: 'yu',
  я: 'ya',
};

const WORD_MIDDLE: Record<string, string> = {
  є: 'ie',
  ї: 'i',
  й: 'i',
  ю: 'iu',
  я: 'ia',
};

const LETTERS: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
};

const LATIN_DIGRAPHS: [string, string][] = [
  ['shch', 'щ'],
  ['zgh', 'зг'],
  ['kh', 'х'],
  ['ts', 'ц'],
  ['ch', 'ч'],
  ['sh', 'ш'],
  ['zh', 'ж'],
];

const LATIN_START: [string, string][] = [
  ...LATIN_DIGRAPHS,
  ['yi', 'ї'],
  ['ye', 'є'],
  ['yu', 'ю'],
  ['ya', 'я'],
];

const LATIN_BODY: [string, string][] = [
  ...LATIN_DIGRAPHS,
  ['iu', 'ю'],
  ['ia', 'я'],
  ['ie', 'є'],
];

const LATIN_LETTERS: [string, string][] = [
  ['a', 'а'],
  ['b', 'б'],
  ['c', 'к'],
  ['d', 'д'],
  ['e', 'е'],
  ['f', 'ф'],
  ['g', 'г'],
  ['h', 'г'],
  ['i', 'і'],
  ['j', 'й'],
  ['k', 'к'],
  ['l', 'л'],
  ['m', 'м'],
  ['n', 'н'],
  ['o', 'о'],
  ['p', 'п'],
  ['q', 'к'],
  ['r', 'р'],
  ['s', 'с'],
  ['t', 'т'],
  ['u', 'у'],
  ['v', 'в'],
  ['w', 'в'],
  ['x', 'кс'],
  ['y', 'и'],
  ['z', 'з'],
];

const LATIN_ENDINGS: [string, string][] = [
  ['skoho', 'ського'],
  ['skyi', 'ський'],
  ['skiy', 'ський'],
  ['ska', 'ська'],
  ['ske', 'ське'],
];

const SEARCH_ALIASES: Record<string, string> = {
  kiev: 'київ',
  lviv: 'львів',
  mykolaiv: 'миколаїв',
};

const SEARCH_NOISE = new Set([
  'branch',
  'branches',
  'parcel',
  'locker',
  'lockers',
  'nova',
  'poshta',
  'post',
  'office',
  'city',
  'village',
  'settlement',
  'street',
  'st',
  'ave',
  'ln',
  'blvd',
  'sq',
  'hwy',
  'up',
  'to',
  'kg',
  'no',
  'number',
  'the',
]);

const SETTLEMENT_TYPES: Record<string, string> = {
  місто: 'city',
  село: 'village',
  селище: 'settlement',
  'селище міського типу': 'urban-type settlement',
  смт: 'urban-type settlement',
};

const WAREHOUSE_KINDS: Record<string, { uk: string; en: string }> = {
  branch: { uk: 'Відділення', en: 'Branch' },
  postomat: { uk: 'Поштомат', en: 'Parcel locker' },
  postbox: { uk: 'Поштомат', en: 'Parcel locker' },
  dropoff: { uk: 'Пункт видачі', en: 'Drop-off point' },
};

function applyCase(source: string, value: string) {
  if (!value) return value;
  return source[0] === source[0]?.toUpperCase()
    ? value[0].toUpperCase() + value.slice(1)
    : value;
}

function transliterateWord(word: string) {
  const lower = word.toLowerCase();
  let result = '';

  for (let index = 0; index < lower.length; index += 1) {
    const char = lower[index];
    if (char === "'" || char === '’' || char === 'ʼ') continue;

    const next = lower[index + 1];
    if (char === 'з' && next === 'г') {
      result += 'zgh';
      index += 1;
      continue;
    }

    if (index === 0 && char in WORD_START) {
      result += WORD_START[char];
      continue;
    }
    if (char in WORD_MIDDLE) {
      result += WORD_MIDDLE[char];
      continue;
    }
    if (char in LETTERS) {
      result += LETTERS[char];
      continue;
    }

    result += char;
  }

  return applyCase(word, result);
}

export function transliterateUkrainian(value: string) {
  return value.replace(/[А-Яа-яІіЇїЄєҐґ''’ʼ]+/g, (word) => transliterateWord(word));
}

export function latinToUkrainian(token: string): string {
  const lower = token.toLowerCase();
  const ending = LATIN_ENDINGS.find(([latin]) => lower.endsWith(latin) && lower.length > latin.length);
  if (ending) {
    return latinToUkrainian(lower.slice(0, -ending[0].length)) + ending[1];
  }

  let rest = lower;
  let result = '';
  while (rest) {
    if (result && rest.startsWith('yi')) {
      const after = rest[2];
      if (!after) {
        result += 'ий';
        rest = '';
        continue;
      }
      if (!'aeiouy'.includes(after)) {
        result += 'иї';
        rest = rest.slice(2);
        continue;
      }
    }

    const pair = (result ? LATIN_BODY : LATIN_START).find(([latin]) => rest.startsWith(latin))
      || LATIN_LETTERS.find(([latin]) => rest.startsWith(latin));
    if (!pair) {
      result += rest[0];
      rest = rest.slice(1);
      continue;
    }
    result += pair[1];
    rest = rest.slice(pair[0].length);
  }
  return result;
}

export function toNovaPoshtaSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return '';
  if (/[А-Яа-яІіЇїЄєҐґ]/.test(trimmed) || !/[A-Za-z]/.test(trimmed)) return trimmed;

  return trimmed
    .split(/[^0-9A-Za-z]+/)
    .filter((part) => part && !SEARCH_NOISE.has(part.toLowerCase()))
    .map((part) => {
      const alias = SEARCH_ALIASES[part.toLowerCase()];
      if (alias) return alias;
      return /[A-Za-z]/.test(part) ? latinToUkrainian(part) : part;
    })
    .join(' ')
    .trim();
}

export function localizeNovaPoshta(value: string, locale: string) {
  if (!value || locale !== 'en' || !/[А-Яа-яІіЇїЄєҐґ]/.test(value)) return value;

  const settlement = value
    .trim()
    .match(/^(місто|село|селище міського типу|селище|смт)\s+(.+)$/i);
  if (settlement) {
    const type = SETTLEMENT_TYPES[settlement[1].toLowerCase()] || settlement[1];
    return `${type} ${transliterateUkrainian(settlement[2])}`;
  }

  let text = value;
  const phrases: [RegExp, string][] = [
    [/вантажне\s+відділення/gi, 'Freight branch'],
    [/поштомат\s+[«"']?\s*нова пошта\s*[»"']?/gi, 'Nova Poshta parcel locker'],
    [/поштомат/gi, 'Parcel locker'],
    [/пункт приймання-видачі/gi, 'Drop-off point'],
    [/пункт/gi, 'Point'],
    [/відділення/gi, 'Branch'],
    [/до\s+(\d+)\s*кг/gi, 'up to $1 kg'],
    [/на одне місце/gi, 'per parcel'],
    [/вул\./gi, 'St.'],
    [/просп\./gi, 'Ave.'],
    [/пров\./gi, 'Ln.'],
    [/бульв\./gi, 'Blvd.'],
    [/пл\./gi, 'Sq.'],
    [/шосе/gi, 'Hwy'],
    [/наб\./gi, 'Emb.'],
  ];

  phrases.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  return transliterateUkrainian(text).replace(/\s+\)/g, ')').replace(/\s{2,}/g, ' ').trim();
}

export function localizeArea(area: string, locale: string) {
  if (!area || locale !== 'en' || !/[А-Яа-яІіЇїЄєҐґ]/.test(area)) return area;
  return `${transliterateUkrainian(area)} oblast`;
}

export function localizeWarehouseKind(kind: string, locale: string) {
  const item = WAREHOUSE_KINDS[kind.trim().toLowerCase()];
  if (!item) return kind;
  return locale === 'en' ? item.en : item.uk;
}
