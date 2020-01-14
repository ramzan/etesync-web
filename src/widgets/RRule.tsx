import * as React from 'react';
import { TextField, Select, MenuItem, FormControlLabel, InputLabel, FormControl } from '@material-ui/core';
import DateTimePicker from '../widgets/DateTimePicker';
import * as ICAL from 'ical.js';

export type RRuleOptions = ICAL.RecurData;

enum Ends {
  Never,
  Date,
  After,
}

enum Months {
  Jan = 1,
  Feb,
  Mar,
  Apr,
  May,
  Jun,
  Jul,
  Aug,
  Sep,
  Oct,
  Nov,
  Dec,
}

enum MonthRepeat {
  Bysetpos,
  Bymonthday,
}

enum WeekDay {
  Su = 1,
  Mo,
  Tu,
  We,
  Th,
  Fr,
  Sa,
}

const disableComplex = true;

const weekdays: WeekDay[] = Array.from(Array(7)).map((_, i) => i + 1);
const months: Months[] = Array.from(Array(12)).map((_, i) => i + 1);

const menuItemsEnds = [Ends.Never, Ends.Date, Ends.After].map((key) => {
  return (
    <MenuItem key={key} value={key}>{Ends[key]}</MenuItem>
  );
});
const menuItemsFrequency = ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'].map((value) => {
  return (
    <MenuItem key={value} value={value}>{value.toLowerCase()}</MenuItem>
  );
});
const menuItemMonths = months.map((month) => {
  return (
    <MenuItem key={month} value={month}>{Months[month]}</MenuItem>
  );
});
const menuItemsWeekDays = weekdays.map((day) => {
  return (
    <MenuItem key={day} value={WeekDay[day].toUpperCase()}>{WeekDay[day]}</MenuItem>
  );
});

const styles = {
  multiSelect: { minWidth: 120, maxWidth: '100%' },
  width: { width: 120 },
};

interface PropsType {
  onChange: (rrule: RRuleOptions) => void;
  rrule: RRuleOptions;
}

export default function RRule(props: PropsType) {
  const options = props.rrule;
  function updateRule(newOptions: Partial<RRuleOptions>): void {
    const updatedOptions = { ...options, ...newOptions };
    props.onChange(updatedOptions);
  }
  function getEnds(): Ends {
    if (options.until && !options.count) {
      return Ends.Date;
    } else if (!options.until && options.count) {
      return Ends.After;
    } else {
      return Ends.Never;
    }
  }
  return (
    <>
      <div style={{ display: 'flex' }}>
        <FormControlLabel
          style={{ marginRight: 0 }}
          value={options.freq}
          label="Repeat every"
          labelPlacement="start"
          control={<TextField
            style={{ marginLeft: '0.5em', width: '4em' }}
            type="number"
            inputProps={{ min: 1, max: 1000 }}
            value={options.interval ?? 1}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              event.preventDefault();
              const inputNode = event.currentTarget as HTMLInputElement;
              if (inputNode.value === '') {
                updateRule({ interval: 1 });
              } else if (inputNode.valueAsNumber) {
                updateRule({ interval: inputNode.valueAsNumber });
              }
            }}
          />}
        />
        <Select
          value={options.freq}
          style={{ marginLeft: '0.5em' }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const freq = (event.target as HTMLSelectElement).value as ICAL.FrequencyValues;
            updateRule({ freq: freq });
          }}
        >
          {menuItemsFrequency}
        </Select>
      </div>
      {!disableComplex && (
        <div style={{ display: 'flex' }}>
          {(options.freq === 'MONTHLY') &&
            <Select value={options.bysetpos ? MonthRepeat.Bysetpos : MonthRepeat.Bymonthday}
              onChange={(event: React.FormEvent<{ value: unknown }>) => {
                const value = Number((event.target as HTMLInputElement).value);
                if (value === MonthRepeat.Bymonthday) {
                  updateRule({ bymonthday: [1], bysetpos: undefined, bymonth: [Months.Jan] });
                } else if (value === MonthRepeat.Bysetpos) {
                  updateRule({ bysetpos: [1], bymonthday: undefined, bymonth: undefined });
                }
              }}>
              <MenuItem value={MonthRepeat.Bymonthday}>On</MenuItem>
              <MenuItem value={MonthRepeat.Bysetpos}>On the</MenuItem>
            </Select>
          }
          {options.bysetpos &&
            <Select value={options.bysetpos[0]}
              onChange={(event: React.FormEvent<{ value: unknown }>) => {
                updateRule({ bysetpos: [Number((event.target as HTMLInputElement).value)] });
              }}>
              <MenuItem value={1}>First</MenuItem>
              <MenuItem value={2}>Second</MenuItem>
              <MenuItem value={3}>Third</MenuItem>
              <MenuItem value={4}>Fourth</MenuItem>
              <MenuItem value={-1}>Last</MenuItem>
            </Select>
          }
        </div>
      )}
      <FormControl>
        <InputLabel>Ends</InputLabel>
        <Select
          value={getEnds()}
          style={styles.width}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            const value = Number((event.target as HTMLSelectElement).value);
            let updateOptions;
            if (value === Ends.Date) {
              updateOptions = { count: undefined, until: ICAL.Time.now() };
            } else if (value === Ends.After) {
              updateOptions = { until: undefined, count: 1 };
            } else {
              updateOptions = { count: undefined, until: undefined };
            }
            updateRule(updateOptions);
          }}>
          {menuItemsEnds}
        </Select>
      </FormControl>
      {options.until &&
        <DateTimePicker
          dateOnly
          value={options.until?.toJSDate() || undefined}
          placeholder="Ends"
          onChange={(date?: Date) => {
            const value = date ? date : null;
            updateRule({ until: ICAL.Time.fromJSDate(value, true) });
          }}
        />
      }
      {options.count &&
        <TextField
          type="number"
          value={options.count}
          label="Count"
          style={{ width: 60 }}
          inputProps={{ min: 1, step: 1 }}
          onChange={(event: React.FormEvent<{ value: unknown }>) => {
            event.preventDefault();
            const inputNode = event.currentTarget as HTMLInputElement;
            if (inputNode.value === '') {
              updateRule({ count: 1 });
            } else if (inputNode.valueAsNumber) {
              updateRule({ count: inputNode.valueAsNumber });
            }
          }}
        />
      }
      <div>
        {(options.freq && options.freq !== 'DAILY') &&
          <div>
            <FormControl>
              <InputLabel>Weekdays</InputLabel>
              <Select
                value={options.byday ? options.byday : []}
                multiple
                style={styles.multiSelect}
                onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                  const value = event.target.value as string[];
                  updateRule({ byday: value });
                }}>
                {menuItemsWeekDays}
              </Select>
            </FormControl>
          </div>
        }
        {options.freq === 'MONTHLY' &&
          <TextField
            type="number"
            value={options.bymonthday ? options.bymonthday[0] : undefined}
            label="Month day"
            style={styles.width}
            inputProps={{ min: 1, step: 1, max: 31 }}
            onChange={(event: React.FormEvent<{ value: unknown }>) => {
              event.preventDefault();
              const value = (event.currentTarget as HTMLInputElement).value;
              const numberValue = Number(value);
              if (value === '') {
                updateRule({ bymonthday: undefined });
              } else if (numberValue < 32 && numberValue > 0) {
                updateRule({ bymonthday: [numberValue] });
              }
            }}
          />
        }
        {options.freq === 'YEARLY' &&
          <div>
            <FormControl>
              <InputLabel>Months</InputLabel>
              <Select
                style={styles.multiSelect}
                value={options.bymonth ? options.bymonth : []}
                multiple
                onChange={(event: React.ChangeEvent<{ value: unknown }>) => {
                  const value = event.target.value as string[];
                  updateRule({ bymonth: value.map((month) => Number(month)) });
                }}>
                {menuItemMonths}
              </Select>
            </FormControl>
          </div>
        }
      </div>
    </>
  );
}
