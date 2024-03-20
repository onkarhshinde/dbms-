Assignment 3

#Question 1 
#Code
chart = {
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, 960, 600]);

  svg.append("path")
      .datum(topojson.merge(us, us.objects.lower48.geometries))
      .attr("fill", "#ddd")
      .attr("d", d3.geoPath());

  svg.append("path")
      .datum(topojson.mesh(us, us.objects.lower48, (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", d3.geoPath());

  const g = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "black");

  const dot = g.selectAll("circle")
    .data(data)
    .join("circle")
      .attr("transform", d => `translate(${d})`);

  svg.append("circle")
      .attr("fill", "blue")
      .attr("transform", `translate(${data[0]})`)
      .attr("r", 3);

  let previousDate = -Infinity;

  return Object.assign(svg.node(), {
    update(date) {
      dot // enter
        .filter(d => d.date > previousDate && d.date <= date)
        .transition().attr("r", 3);
      dot // exit
        .filter(d => d.date <= previousDate && d.date > date)
        .transition().attr("r", 0);
      previousDate = date;
    }
  });
}

#question 2 
#Code
chart = {
  const svg = d3.create("svg").attr("viewBox", [0, 0, 960, 600]);

  svg.append("path").datum(topojson.merge(us, us.objects.lower48.geometries)).attr("fill", "#f0f0f0").attr("d", d3.geoPath());

  svg.append("path").datum(topojson.mesh(us, us.objects.lower48, (a, b) => a !== b)).attr("fill", "none").attr("stroke", "#999").attr("stroke-linejoin", "round").attr("d", d3.geoPath());

  const adjustedData = data.map(d => ({coordinates: [d[0], d[1]], date: new Date(d.date)}));

  const midpointGroup = svg.append("g");

  function findNearestOutlet(filteredData, targetOutlet) {
    let nearestOutlet = null, shortestDistance = Infinity;
    filteredData.forEach(outlet => {
      if (outlet === targetOutlet) return;
      const distance = Math.sqrt(Math.pow(outlet.coordinates[0] - targetOutlet.coordinates[0], 2) + Math.pow(outlet.coordinates[1] - targetOutlet.coordinates[1], 2));
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestOutlet = outlet;
      }
    });
    return nearestOutlet;
  }

  function calculateMidpoints(filteredData) {
    return filteredData.map(outlet => {
      const nearestOutlet = findNearestOutlet(filteredData, outlet);
      if (!nearestOutlet) return null;
      const midpoint = [(outlet.coordinates[0] + nearestOutlet.coordinates[0]) / 2, (outlet.coordinates[1] + nearestOutlet.coordinates[1]) / 2];
      return { midpoint };
    }).filter(d => d !== null);
  }

  function update(selectedDate) {
    const parsedSelectedDate = new Date(selectedDate);
    const filteredData = adjustedData.filter(d => d.date <= parsedSelectedDate);
    const midpointsData = calculateMidpoints(filteredData);

    const midpoints = midpointGroup.selectAll("circle").data(midpointsData, d => d.midpoint.join(","));

    midpoints.enter().append("circle").attr("transform", d => `translate(${d.midpoint})`).attr("r", 0).attr("fill", "#4682B4").transition().duration(300).attr("r", 3);
    midpoints.exit().transition().duration(500).attr("r", 0).remove();
  }

  const latestDate = d3.max(adjustedData, d => d.date);
  update(latestDate.toISOString());

  return Object.assign(svg.node(), { update });
}
#Question 3
#code
const width = 928;
const height = 581;
const projection = d3.geoAlbersUsa().scale(4 / 3 * width).translate([width / 2, height / 2]);

const svg = d3.create("svg")
  .attr("viewBox", [0, 0, width, height])
  .attr("width", width)
  .attr("height", height)
  .attr("style", "max-width: 100%; height: auto;");

svg.append("path")
  .datum(stateMesh)
  .attr("fill", "none")
  .attr("stroke", "#aaa")
  .attr("stroke-width", 1)
  .attr("stroke-linejoin", "round")
  .attr("d", d3.geoPath(projection));

// Preprocess the data to sum up cases per state per year per disease
let stateYearlyDiseaseCases = {};

Object.entries(processedData3).forEach(([disease, diseaseData]) => {
  Object.entries(diseaseData).forEach(([yearState, data]) => {
    const [year, state] = yearState.split("-");
    const key = `${disease}-${year}-${state}`;

    if (!stateYearlyDiseaseCases[key]) {
      stateYearlyDiseaseCases[key] = {
        disease,
        year,
        state,
        cases: 0,
        latitude: data.latitude,
        longitude: data.longitude,
      };
    }

    stateYearlyDiseaseCases[key].cases += data.cases;
  });
});

// Flatten the stateYearlyDiseaseCases object into an array for D3
let flatData = Object.values(stateYearlyDiseaseCases);

const maxCases = d3.max(flatData, d => d.cases);
const radiusScale = d3.scaleSqrt().domain([0, maxCases]).range([0, 25]);

// Use flatData to draw the circles
const circles = svg.selectAll("circle")
  .data(flatData)
  .enter().append("circle")
  .attr("transform", d => {
    const coords = projection([d.longitude, d.latitude]);
    return coords ? `translate(${coords})` : null;
  })
  .attr("r", d => radiusScale(d.cases))
  .attr("fill", d3.interpolateYlGn(1 - (d3.max(flatData, d => d.cases) - d.cases) / (d3.max(flatData, d => d.cases) - 1)))
  .attr("opacity", 0.7)
  .append("title")
  .text(d => `${d.disease} - ${d.year}-${d.state}: ${d.cases} total cases`);

// Immediately set the radius of the circles based on cases without transition
function update(year) {
  const yearData = flatData.filter(d => d.year === String(year));

  svg.selectAll("circle")
    .data(yearData)
    .attr("r", d => radiusScale(d.cases));
}

// Initial update to show the circles for the first year
const initialYear = d3.min(flatData, d => d.year);
update(initialYear);

return Object.assign(svg.node(), { update });

  

#question 4
#code
Chart4 = {
  const w = 928;
const h = 581;
const p = d3.geoAlbersUsa().scale(4 / 3 * w).translate([w / 2, h / 2]);
const s = d3.create("svg")
  .attr("viewBox", [0, 0, w, h])
  .attr("width", w)
  .attr("height", h)
  .attr("style", "max-width: 100%; height: auto;");

s.append("path")
  .datum(stateMesh)
  .attr("fill", "none")
  .attr("stroke", "#777")
  .attr("stroke-width", 0.5)
  .attr("stroke-linejoin", "round")
  .attr("d", d3.geoPath(p));

let sYC = {};
aggregatedArray.forEach(i => {
  Object.entries(i).forEach(([yS, d]) => {
    if (!sYC[yS]) {
      sYC[yS] = {
        year: d.year,
        state: d.state,
        cases: 0,
        latitude: d.latitude,
        longitude: d.longitude
      };
    }
    sYC[yS].cases += d.cases;
  });
});

let fD = Object.values(sYC);

const mC = d3.max(fD, d => d.cases);
const rS = d3.scaleSqrt().domain([d3.min(fD, d => d.cases), mC]).range([0, 25]);

const c = s.selectAll("circle")
  .data(fD, d => `${d.year}-${d.state}`)
  .enter().append("circle")
    .attr("transform", d => {
      const c = p([d.longitude, d.latitude]);
      return c ? `translate(${c})` : null;
    })
    .attr("r", d => rS(d.cases))
    .attr("fill", "green")
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .append("title")
    .text(d => `${d.year}-${d.state}: ${d.cases} total cases`);

function update(year) {
  const yD = fD.filter(d => d.year === String(year));
  s.selectAll("circle")
    .data(yD, d => `${d.year}-${d.state}`)
    .attr("r", d => rS(d.cases));
}

const iY = d3.min(fD, d => d.year);
update(iY);

return Object.assign(s.node(), { update });

};

#Question 5
#code
Chart5 = {
  const width = 928;
  const height = 581;
  const projection = d3.geoAlbersUsa().scale(4 / 3 * width).translate([width / 2, height / 2]);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

  svg.append("path")
    .datum(stateMesh)
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 1)
    .attr("stroke-linejoin", "round")
    .attr("d", d3.geoPath(projection));

  // Preprocess the data to sum up cases per state per year per gender
  let stateYearlyGenderCases = {};

  Object.entries(processedData3).forEach(([disease, diseaseData]) => {
    Object.entries(diseaseData).forEach(([yearStateGender, data]) => {
      const [year, state, gender] = yearStateGender.split("-");
      const key = `${year}-${state}-${gender}`;

      if (!stateYearlyGenderCases[key]) {
        stateYearlyGenderCases[key] = {
          year,
          state,
          gender,
          cases: 0,
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }

      stateYearlyGenderCases[key].cases += data.cases;
    });
  });

  // Flatten the stateYearlyGenderCases object into an array for D3
  let flatData = Object.values(stateYearlyGenderCases);

  const maxCases = d3.max(flatData, d => d.cases);
  const radiusScale = d3.scaleSqrt().domain([d3.min(flatData, d => d.cases), maxCases]).range([0, 25]);

  // Define a color scale with distinct colors for male and female
  const colorScale = d3.scaleOrdinal()
    .domain(["Male", "Female"])
    .range(["green", "yellow"]);

  // Use flatData to draw the circles
  const circles = svg.selectAll("circle")
    .data(flatData, d => `${d.year}-${d.state}-${d.gender}`)
    .enter().append("circle")
    .attr("transform", d => {
      const coords = projection([d.longitude, d.latitude]);
      return coords ? `translate(${coords})` : null;
    })
    .attr("r", d => radiusScale(d.cases))
    .attr("fill", d => colorScale(d.gender))
    .append("title")
    .text(d => `${d.year}-${d.state}-${d.gender}: ${d.cases} total cases`);

  // Add legend
  const legend = svg.selectAll(".legend")
    .data(colorScale.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  legend.append("rect")
    .attr("x", width - 180)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", colorScale);

  legend.append("text")
    .attr("x", width - 156)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(d => d);

  // Immediately set the radius of the circles based on cases without transition
  function update(year) {
    const yearData = flatData.filter(d => d.year === String(year));

    svg.selectAll("circle")
      .data(yearData, d => `${d.year}-${d.state}-${d.gender}`)
      .attr("r", d => radiusScale(d.cases));
  }

  // Initial update to show the circles for the first year
  const initialYear = d3.min(flatData, d => d.year);
  update(initialYear);

  return Object.assign(svg.node(), { update });
};
