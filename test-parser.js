// Parser Validation Test
// This extracts and tests the smart parser logic

const normalizeModuleCode = (code) => {
  return code.trim().toUpperCase().replace(/\s+/g, '');
};

const parseTime = (text) => {
  const lower = text.toLowerCase();
  
  const patterns = [
    { 
      regex: /\b(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
      getTime: (m) => {
        let hour = Number(m[1]);
        const minute = m[2] ? Number(m[2]) : 0;
        const meridiem = m[3]?.toLowerCase();
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        return { hour, minute };
      }
    },
    { 
      regex: /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
      getTime: (m) => {
        let hour = Number(m[1]);
        const minute = Number(m[2]);
        const meridiem = m[3]?.toLowerCase();
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        return { hour, minute };
      }
    },
    { 
      regex: /\b(\d{1,2})\s*(am|pm)\b/i,
      getTime: (m) => {
        let hour = Number(m[1]);
        const minute = 0;
        const meridiem = m[2]?.toLowerCase();
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        return { hour, minute };
      }
    }
  ];

  for (const { regex, getTime } of patterns) {
    const match = lower.match(regex);
    if (match) {
      return { ...getTime(match), matched: true };
    }
  }

  return { hour: 20, minute: 0, matched: false };
};

const parseRelativeDate = (text) => {
  const lower = text.toLowerCase();
  const now = new Date();
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const { hour, minute } = parseTime(text);

  const getTargetDate = (dayOffset) => {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  if (lower.match(/\b(today|tonight)\b/)) {
    return getTargetDate(0);
  }

  if (lower.match(/\b(tomorrow)\b/)) {
    return getTargetDate(1);
  }

  const nextDayMatch = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  const dayName = nextDayMatch ? nextDayMatch[1] : dayMatch ? dayMatch[1] : null;

  if (dayName) {
    const targetIndex = weekdays.indexOf(dayName);
    const currentIndex = now.getDay();
    let diff = targetIndex - currentIndex;
    if (diff <= 0) diff += 7;
    if (nextDayMatch && diff === 0) diff = 7;
    return getTargetDate(diff);
  }

  return null;
};

const parseSpecificDate = (text) => {
  const lower = text.toLowerCase();
  const { hour, minute } = parseTime(text);

  const patterns = [
    {
      regex: /(\d{4})-(\d{1,2})-(\d{1,2})/,
      parse: (m) => new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour, minute)
    },
    {
      regex: /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/,
      parse: (m) => {
        const day = Number(m[1]);
        const month = Number(m[2]);
        const year = m[3] ? Number(m[3]) : new Date().getFullYear();
        return new Date(year, month - 1, day, hour, minute);
      }
    },
    {
      regex: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*(?:\s+(\d{4}))?/i,
      parse: (m) => {
        const day = Number(m[1]);
        const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        const month = months[m[2].toLowerCase().substring(0, 3)];
        const year = m[3] ? Number(m[3]) : new Date().getFullYear();
        return new Date(year, month, day, hour, minute);
      }
    },
    {
      regex: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})(?:\s+(\d{4}))?/i,
      parse: (m) => {
        const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
        const month = months[m[1].toLowerCase().substring(0, 3)];
        const day = Number(m[2]);
        const year = m[3] ? Number(m[3]) : new Date().getFullYear();
        return new Date(year, month, day, hour, minute);
      }
    }
  ];

  for (const { regex, parse } of patterns) {
    const match = lower.match(regex);
    if (match) {
      const date = parse(match);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
};

const parseDeadline = (text) => {
  let date = parseSpecificDate(text);
  if (date && !isNaN(date.getTime())) {
    return date.toISOString();
  }

  date = parseRelativeDate(text);
  if (date && !isNaN(date.getTime())) {
    return date.toISOString();
  }

  return null;
};

const detectPriority = (text) => {
  const lower = text.toLowerCase();
  if (lower.match(/\b(urgent|asap|critical|now)\b/)) return 5;
  if (lower.match(/\b(high|important|priority)\b/)) return 5;
  if (lower.match(/\b(low|later|whenever)\b/)) return 1;
  return 3;
};

const mockModules = [
  { id: 1, module_code: 'CS2030S', module_name: 'Data Structures and Algorithms' },
  { id: 2, module_code: 'ST2334', module_name: 'Probability and Statistics' },
  { id: 3, module_code: 'BT1101', module_name: 'Computational Biology' },
  { id: 4, module_code: 'IS2218', module_name: 'IT Security' },
  { id: 5, module_code: 'CS2040', module_name: 'Data Structures' }
];

const detectModule = (text) => {
  if (mockModules.length === 0) return null;

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  for (const module of mockModules) {
    const moduleCodeNorm = normalizeModuleCode(module.module_code);
    for (const word of words) {
      if (normalizeModuleCode(word) === moduleCodeNorm) {
        return { id: module.id, code: module.module_code };
      }
    }
  }

  for (const module of mockModules) {
    const moduleName = module.module_name?.toLowerCase() || '';
    const shortName = moduleName.split(' ')[0];

    if (moduleName && lower.includes(moduleName)) {
      return { id: module.id, code: module.module_code };
    }

    if (shortName && shortName.length > 2 && lower.includes(shortName)) {
      return { id: module.id, code: module.module_code };
    }
  }

  return null;
};

const removeParsedFragmentsFromTitle = (text, moduleInfo, deadline, priority) => {
  let title = text;

  if (moduleInfo?.code) {
    const codePattern = new RegExp(`\\b${normalizeModuleCode(moduleInfo.code).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    title = title.replace(codePattern, '');
  }

  title = title.replace(/\b(urgent|asap|high|important|critical|now|priority|low|later|whenever)\b/gi, '');
  title = title.replace(/\b(today|tonight|tomorrow)\b/gi, '');
  title = title.replace(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
  title = title.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
  title = title.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*/gi, '');
  
  // Remove dates: 2026-05-20, 20/05/2026, 20/05, 20-05
  title = title.replace(/\d{4}-\d{1,2}-\d{1,2}/g, '');
  title = title.replace(/\d{1,2}[/-]\d{1,2}(?:[/-]\d{4})?/g, '');
  
  // Remove time: at 8pm, 8pm, 20:00, 8:30am
  title = title.replace(/\b(?:at|@)\s*\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, '');
  title = title.replace(/\b\d{1,2}:\d{2}(?:\s*(am|pm))?\b/gi, ''); // 20:00 or 8:30pm
  title = title.replace(/\b\d{1,2}\s*(am|pm)\b/gi, ''); // 8pm
  title = title.replace(/\b(by|due|deadline|at|on|this)\b/gi, '');
  title = title.trim().replace(/\s{2,}/g, ' ').trim();

  return title;
};

const parseQuickTaskInput = (text) => {
  const moduleInfo = detectModule(text);
  const priority = detectPriority(text);
  const deadline = parseDeadline(text);

  const title = removeParsedFragmentsFromTitle(text, moduleInfo, deadline, priority);

  return {
    title: title || text.trim(),
    priority,
    module_id: moduleInfo?.id || null,
    moduleLabel: moduleInfo?.code || '',
    deadline,
  };
};

const priorityLabel = (priority) => {
  return priority === 5 ? 'High' : priority === 1 ? 'Low' : 'Medium';
};

const formatDate = (isoString) => {
  if (!isoString) return 'No deadline';
  const date = new Date(isoString);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + 
         date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Test cases
const testCases = [
  {
    input: 'finish CS2030S assignment 1 friday 9pm high',
    expected: {
      module: 'CS2030S',
      title: 'finish assignment 1',
      priority: 'High',
      hasDeadline: true
    }
  },
  {
    input: 'ST2334 quiz 2 tomorrow',
    expected: {
      module: 'ST2334',
      title: 'quiz 2',
      priority: 'Medium',
      hasDeadline: true
    }
  },
  {
    input: 'orbital README 2026-05-20 20:00 urgent',
    expected: {
      module: '',
      title: 'README',
      priority: 'High',
      hasDeadline: true
    }
  },
  {
    input: 'CS2040 tutorial 3 20/05',
    expected: {
      module: 'CS2040',
      title: 'tutorial 3',
      priority: 'Medium',
      hasDeadline: true
    }
  }
];

console.log('========================================');
console.log('SMART PARSER VALIDATION TESTS');
console.log('========================================\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`Input: "${testCase.input}"`);
  
  const result = parseQuickTaskInput(testCase.input);
  
  console.log(`\nResults:`);
  console.log(`  Module: ${result.moduleLabel || '(not detected)'}`);
  console.log(`  Title: "${result.title}"`);
  console.log(`  Priority: ${priorityLabel(result.priority)}`);
  console.log(`  Deadline: ${result.deadline ? formatDate(result.deadline) : 'No deadline'}`);
  
  console.log(`\nExpected:`);
  console.log(`  Module: ${testCase.expected.module || '(not detected)'}`);
  console.log(`  Title: "${testCase.expected.title}"`);
  console.log(`  Priority: ${testCase.expected.priority}`);
  console.log(`  Deadline: ${testCase.expected.hasDeadline ? '✓ Has deadline' : '✗ No deadline'}`);
  
  console.log('\n' + '========================================\n');
});

console.log('All test cases completed!');
