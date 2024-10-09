import React, { useState } from 'react';

const DateFilter = ({ onFilter }) => {
  const [filterType, setFilterType] = useState('range'); // range, month, week, year, or preset
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [week, setWeek] = useState('');
  const [preset, setPreset] = useState('');

  const handleFilterChange = () => {
    onFilter({
      filterType,
      startDate,
      endDate,
      month,
      year,
      week,
      preset,
    });
  };

  return (
    <div className="date-filter">
      <h3>Filtrer par Date</h3>
      <div>
        <label>
          <input
            type="radio"
            value="range"
            checked={filterType === 'range'}
            onChange={() => setFilterType('range')}
          />
          Plage de Dates
        </label>
        {filterType === 'range' && (
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>
      
      <div>
        <label>
          <input
            type="radio"
            value="month"
            checked={filterType === 'month'}
            onChange={() => setFilterType('month')}
          />
          Par Mois
        </label>
        {filterType === 'month' && (
          <div>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        )}
      </div>

      <div>
        <label>
          <input
            type="radio"
            value="week"
            checked={filterType === 'week'}
            onChange={() => setFilterType('week')}
          />
          Par Semaine
        </label>
        {filterType === 'week' && (
          <div>
            <input
              type="week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            />
          </div>
        )}
      </div>

      <div>
        <label>
          <input
            type="radio"
            value="year"
            checked={filterType === 'year'}
            onChange={() => setFilterType('year')}
          />
          Par Année
        </label>
        {filterType === 'year' && (
          <div>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Année"
            />
          </div>
        )}
      </div>

      <div>
        <label>
          <input
            type="radio"
            value="preset"
            checked={filterType === 'preset'}
            onChange={() => setFilterType('preset')}
          />
          Prédéfinis
        </label>
        {filterType === 'preset' && (
          <div>
            <button onClick={() => setPreset('today')}>Aujourd'hui</button>
            <button onClick={() => setPreset('week')}>Cette Semaine</button>
            <button onClick={() => setPreset('month')}>Ce Mois-ci</button>
            <button onClick={() => setPreset('year')}>Cette Année</button>
          </div>
        )}
      </div>

      <button onClick={handleFilterChange}>Appliquer</button>
    </div>
  );
};

export default DateFilter;
