export interface ParsedRecord {
  id: string;
  folderName: string;
  name: string;
  ssn: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  rawLine: string;
  txtContent: string;
}

export type DobFormat = 'M/D/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'RAW';

export function formatDob(dobStr: string, format: DobFormat): string {
  if (!dobStr || dobStr === 'N/A') return '';
  
  // Try matching YYYY-MM-DD
  const ymdMatch = dobStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (format === 'M/D/YYYY') return `${month}/${day}/${y}`;
    if (format === 'MM/DD/YYYY') return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${y}`;
    if (format === 'YYYY-MM-DD') return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Try matching MM/DD/YYYY or M/D/YYYY
  const mdyMatch = dobStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (mdyMatch) {
    const [, m, d, y] = mdyMatch;
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (format === 'M/D/YYYY') return `${month}/${day}/${y}`;
    if (format === 'MM/DD/YYYY') return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${y}`;
    if (format === 'YYYY-MM-DD') return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return dobStr;
}

export function generateTxtContent(
  record: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    dob: string;
    ssn: string;
    phone: string;
  },
  dobFormat: DobFormat = 'M/D/YYYY',
  includePhone: boolean = true
): string {
  const formattedDob = formatDob(record.dob, dobFormat);
  const addressLine = [record.address, record.city, record.state, record.zip]
    .filter(Boolean)
    .join(' ')
    .trim();

  const lines: string[] = [];

  // Line 1: NAME  ADDRESS
  if (record.name && addressLine) {
    lines.push(`${record.name}  ${addressLine}`);
  } else if (record.name) {
    lines.push(record.name);
  } else if (addressLine) {
    lines.push(addressLine);
  }

  // Line 2: *DOB
  if (formattedDob) {
    lines.push(`*${formattedDob}`);
  }

  // Line 3: *       SSN
  if (record.ssn && record.ssn !== 'N/A') {
    lines.push(`*       ${record.ssn}`);
  }

  // Line 4: Phone (optional)
  if (includePhone && record.phone && record.phone !== 'N/A') {
    lines.push(`Phone: ${record.phone}`);
  }

  return lines.join('\n');
}

export function parseRawCsvText(
  rawText: string,
  dobFormat: DobFormat = 'M/D/YYYY',
  includePhone: boolean = true
): ParsedRecord[] {
  if (!rawText || !rawText.trim()) return [];

  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return [];

  // Detect delimiter in header/first line (comma, tab, pipe, semicolon)
  const firstLine = rawLines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes('|') && !firstLine.includes(',')) delimiter = '|';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  // Helper to split line by delimiter while respecting potential quotes
  const splitLine = (line: string): string[] => {
    if (delimiter === '\t' || delimiter === '|') {
      return line.split(delimiter).map((p) => p.trim());
    }

    // CSV regex split
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headerCells = splitLine(firstLine).map((h) => h.toUpperCase());
  
  // Check if first line is a header
  const isHeader = headerCells.some((h) =>
    ['SSN', 'NAME', 'DOB', 'ADDRESS', 'CITY', 'STATE', 'ZIP', 'PHONES', 'EMAIL', 'TÊN'].some((kw) =>
      h.includes(kw)
    )
  );

  let nameIdx = -1;
  let ssnIdx = -1;
  let dobIdx = -1;
  let addrIdx = -1;
  let cityIdx = -1;
  let stateIdx = -1;
  let zipIdx = -1;
  let phoneIdx = -1;
  let emailIdx = -1;

  let startIndex = 0;

  if (isHeader) {
    startIndex = 1;
    headerCells.forEach((header, idx) => {
      if (header.includes('NAME') || header.includes('TÊN') || header === 'FULLNAME') nameIdx = idx;
      else if (header.includes('SSN') || header.includes('SOCIAL')) ssnIdx = idx;
      else if (header.includes('DOB') || header.includes('BIRTH') || header.includes('NGÀY SINH')) dobIdx = idx;
      else if (header.includes('ADDR') || header.includes('STREET') || header.includes('ĐỊA CHỈ')) addrIdx = idx;
      else if (header.includes('CITY')) cityIdx = idx;
      else if (header.includes('STATE')) stateIdx = idx;
      else if (header.includes('ZIP') || header.includes('POSTAL')) zipIdx = idx;
      else if (header.includes('PHONE') || header.includes('SĐT') || header.includes('TEL')) phoneIdx = idx;
      else if (header.includes('EMAIL')) emailIdx = idx;
    });
  } else {
    // Standard default mapping: SSN=0, NAME=1, DOB=2, ADDRESS=3, CITY=4, STATE=5, ZIP=6
    ssnIdx = 0;
    nameIdx = 1;
    dobIdx = 2;
    addrIdx = 3;
    cityIdx = 4;
    stateIdx = 5;
    zipIdx = 6;
    phoneIdx = 9;
    emailIdx = 10;
  }

  const records: ParsedRecord[] = [];

  for (let i = startIndex; i < rawLines.length; i++) {
    const line = rawLines[i];
    const cells = splitLine(line);
    if (cells.length === 0 || cells.every((c) => !c)) continue;

    let name = (nameIdx >= 0 && cells[nameIdx]) ? cells[nameIdx] : '';
    let ssn = (ssnIdx >= 0 && cells[ssnIdx]) ? cells[ssnIdx] : '';
    let dob = (dobIdx >= 0 && cells[dobIdx]) ? cells[dobIdx] : '';
    let address = (addrIdx >= 0 && cells[addrIdx]) ? cells[addrIdx] : '';
    let city = (cityIdx >= 0 && cells[cityIdx]) ? cells[cityIdx] : '';
    let state = (stateIdx >= 0 && cells[stateIdx]) ? cells[stateIdx] : '';
    let zip = (zipIdx >= 0 && cells[zipIdx]) ? cells[zipIdx] : '';
    let phone = (phoneIdx >= 0 && cells[phoneIdx]) ? cells[phoneIdx] : '';
    let email = (emailIdx >= 0 && cells[emailIdx]) ? cells[emailIdx] : '';

    // If only 1 cell exists per line (plain name list)
    if (cells.length === 1 && !name) {
      name = cells[0];
    }

    // Clean up address (remove old_address metadata if present)
    if (address && address.includes('|')) {
      address = address.split('|')[0].trim();
    }

    // Clean phone (remove old_phone metadata if present)
    if (phone && phone.includes('|')) {
      phone = phone.split('|')[0].trim();
    }

    // Clean folder name (remove illegal characters for Windows/Google Drive)
    const cleanFolderName = (name || `Hồ sơ ${i}`).replace(/[\\/:*?"<>|]/g, '').trim();

    const txtContent = generateTxtContent(
      { name, address, city, state, zip, dob, ssn, phone },
      dobFormat,
      includePhone
    );

    records.push({
      id: `row_${i}_${Date.now()}`,
      folderName: cleanFolderName,
      name,
      ssn,
      dob,
      address,
      city,
      state,
      zip,
      phone,
      email,
      rawLine: line,
      txtContent,
    });
  }

  return records;
}
