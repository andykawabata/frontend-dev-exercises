import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import csvData from './census.csv';
import Plot from 'react-plotly.js';
import { nest } from 'd3-collection';


function App() {

  const COLUMNS = {
    EDUCATION: "education_level",
    RACE: "race",
    AGE: "age",
    SEX: "sex"
  }

  const INITIAL_COLUMN = COLUMNS.EDUCATION;

  const [censusData, setCensusData] = useState();
  const [plotData, setPlotData] = useState();
  const [column, setColumn] = useState();

  // load csv data and set column when page initially loads
  useEffect(() => {
    d3.csv(csvData).then((d, e) => {
      setCensusData(d);
      setColumn(INITIAL_COLUMN);
    })
  }, []);

  // effect to to run whenever column is set. 
  useEffect(() => {
    if (column && censusData)
      setPlotData(generatePlotData());
  }, [column]);

  // groups data based on current column state, returns object containing axis data for plotly
  function generatePlotData() {
    // use d3 nest function to group by category and get mean of over_50k (which is a 1 or 0)
    let groupOver50k = nest()
      .key(function (d) { return d[column] })
      .rollup(function (d) { return d3.mean(d, function (g) { return g.over_50k; }); })
      .entries(censusData);

    // sort objects by percentage
    groupOver50k.sort((a, b) => (a.value > b.value) ? 1 : -1)

    // convert decimals to percentages, and rename object keys
    let groupPercentages = groupOver50k.map(obj => ({ "group": obj.key, "percentage": (obj.value * 100) }))

    // get information into Plotly-friendly format
    let x = [], y1 = [], y2 = [];
    groupPercentages.forEach(obj => {
      x.push(obj.group);
      y1.push(obj.percentage);
      y2.push(100 - obj.percentage);
    })
    return { "x": x, "y1": y1, "y2": y2 }
  }

  // handles radio button change
  function handleColumnChange(event) {
    setColumn(event.target.value);
  }

  // replaces underscores with spaces and capitalizes first letter of words
  function toDisplayName(columnName) {
    const words = columnName.split("_");
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    return words.join(" ");
  }

  return (
    <div className="App">
      {plotData ?
        <div className="container" id="contentWrapper">
          <div className="row justify-content-center ">
            <div className="col-auto">
              <Plot
                // data contains 2 objects. The first represents the blue bars and 
                // the second represnts the stacked red bars.
                data={[
                  {
                    x: plotData.x,
                    y: plotData.y1,
                    name: 'Over 50k',
                    type: 'bar',
                    marker: { color: 'cornflowerblue' }
                  },
                  {
                    x: plotData.x,
                    y: plotData.y2,
                    name: 'Under 50k',
                    type: 'bar',
                    marker: { color: 'salmon' }

                  }]}
                layout={{

                  width: 700,
                  height: 600,
                  title: 'Annual Income by ' + toDisplayName(column),
                  barmode: 'stack',
                  yaxis:
                  {
                    ticksuffix: "%",
                    title: { text: "Count", standoff: 10 },
                  },
                  xaxis:
                  {
                    title: { text: toDisplayName(column), standoff: 20 },
                    automargin: true,
                    p: { t: 20 }

                  }
                }}
              />
            </div>
            <div className="col-auto d-flex align-items-md-center">
              <div>
                <h6 className="bg-dark text-light mb-0 p-1">Choose Category</h6>
                <div id="radioContainer" className="p-2" style={{ background: "Gainsboro" }} >
                  {// render a radio button for each column in COLUMNS object
                    Object.keys(COLUMNS).map((key, i) => {
                      return (
                        <div className="radio-button" key={i}>
                          <input
                            type="radio"
                            value={COLUMNS[key]}
                            onChange={handleColumnChange}
                            checked={column === COLUMNS[key]}
                          />
                          <label>{toDisplayName(COLUMNS[key])}</label>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        : null}
    </div>
  );
}

export default App;
