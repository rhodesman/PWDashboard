//// START Global Variables \\\\

    var data = [],
        startPoints = 0, // must be zero
        totalPoints = 100; // total data points to draw on Line Chart

    var chartArray = {battery: [],house: [],solar: [],grid: [],date: []}; // Object Array for total captured points
    var current = {solar: '',battery: '',grid: '',house: ''}; // Object of most current captued points
    var maxValue = 0,
        minValue = -500; // Initial settings for total graph Plot Points
    var color = {battery: '#8BC34A',house: '#607D8B',solar: '#ffa600',grid: '#adadad'}; // Colors for Data Points
    var ani = 1; // set animate points
    var maxSolar_kW = 10.725; // Size of your Solar Array in kW
    var gridCost = 0.18085128; // Cost of Grid use $$$/kWh

    /**************
     * Address to your NodeJS app.js API server
     * This should be an address the client accessing the UI can access
     * Example: 127.0.0.1:#{port address}/#{folder set in routes.js}
    **************/
    var nodeAPIaddr = 'http://10.0.10.202:3301/api';

//// END Global Variables \\\\

$(function () {
    setTimeout(function () {
        $('.page-loader-wrapper').fadeOut();
    }, 50);

    // Set Intervals to page API for new Data, 1000 = 1 second
    setInterval(buildChart, 1500);
    setInterval(getTodayData, 30000);

    // Changes donut chart when the windowsize changes
    $(window).resize(reDraw());
});

function reDraw() {
    var pieHeight = $('#pie_chart').width();
    $('#pie_chart').css('height', pieHeight);
}

//// Call to API functions \\\\
function getData(dataType, callback) {
    /****
     * Gets data stored in your MongoDB Cloud
     * via your api route settings
    ****/
    var dataStreams = nodeAPIaddr;
    if (dataType == '') {
        $.getJSON(dataStreams, function (returndata) {
            return( callback(returndata) );
        });
    }else {
        dataStreams = [dataStreams + dataType];
        $.getJSON(dataStreams, function (returndata) {
            return( callback(returndata) );
        });
    }
}
function streamPWApi(dataType, callback) {
    /****
     * Gets data stream directly from the powerwall API
     * via your API middleware thowarting CORS issues
     * with Tesla SSL Settings
     ****/
    var pwAPIAddr = nodeAPIaddr + '/stream/';
    if (dataType == 'undefined') {
        dataType = 'meters';
    }
    var dataStreams = [
        pwAPIAddr + dataType
    ];
    if (dataType == 'meters') {
      fetch(dataStreams)
        .then(
          function(response) {
            if (response.status !== 200) {
              console.log('Looks like there was a problem. Status Code: ' +
                response.status);
              return;
            }

            // Examine the text in the response
            response.json().then(function(returndata) {
              var houseOutput = returndata.load.instant_power / 1000;
              $('#house-consumption .number').text(houseOutput.toFixed(3) + " kW");
              return( callback(returndata) );
            });
          }
        ).catch(function(err) {
          console.log('Fetch Error :-S', err);
        });
    } else {
      fetch(dataStreams)
        .then(
          function(response) {
            if (response.status !== 200) {
              console.log('Looks like there was a problem. Status Code: ' +
                response.status);
              return;
            }
            response.json().then(function(returndata) {
              return( callback(returndata) );
            });
          }
        ).catch(function(err) {
          console.log('Fetch Error :-S', err);
        });
    }
}
//// END API Functions \\\\

//// Build Flot Charts \\\\
function initCharts() {
    /****
     * Renders the data for the info boxes below the main line chart
    ****/
    $('.chart.chart-bar').sparkline(undefined, {
        type: 'bar',
        barColor: 'rgba(0, 0, 0, 0.15)',
        negBarColor: 'rgba(0, 0, 0, 0.15)',
        barWidth: '8px',
        height: '34px'
    }); // This isn't working yet: need to access last 5-6 hours of data to plot points
    streamPWApi('system_status', function (data) {
        var battLevel = data.percentage;
        var discharge = 100 - battLevel;
        $('#battery-level .chart.chart-pie').text(discharge + "," + battLevel);
        $('#battery-level .number').text(battLevel.toFixed(1)+ " %");
        $('.chart.chart-pie').sparkline(undefined, {
            type: 'pie',
            height: '50px',
            sliceColors: ['rgba(0,0,0,0.10)', 'rgba(255,255,255,0.25)']
        });
        data = null;
    });
}
function buildChart() {
    /****
     * Main Function for rendering charts based off of data pulled from
     * powerwall API
     ****/
    initCharts();
    streamPWApi('meters', function (results) {
        if (startPoints > totalPoints) {
            /****
             *  Once the chart exceeds totalPoints to display,
             *  shift everything over by one (deleting oldest point)
            ****/
            chartArray.battery.shift();
            chartArray.house.shift();
            chartArray.solar.shift();
            chartArray.grid.shift();
        }
        /****
         * Add the results to our local array for rendering charts and lots of math.
        ****/
        chartArray.battery.push([startPoints, results.battery.instant_power]);
        chartArray.house.push([startPoints, results.load.instant_power]);
        chartArray.solar.push([startPoints, results.solar.instant_power]);
        chartArray.grid.push([startPoints, results.site.instant_power]);

        /****
         * Add the results to a current array for displaying current live data
         ****/
        current.solar = (results.solar.instant_power / 1000);
        current.battery = (results.battery.instant_power / 1000);
        current.grid = (results.site.instant_power / 1000);
        current.house = (results.load.instant_power / 1000);

        /****
         * This sets the min and max values of the line chart regardless of how high
         * or low the datapoints are
         ****/
        var testArray = [];
        for (n = 0; n < chartArray.house.length; n++) {
            testArray.push(chartArray.battery[n][1]);
            testArray.push(chartArray.solar[n][1]);
            testArray.push(chartArray.grid[n][1]);
        }
        maxValue = (Math.max.apply(null, testArray) + 100); //Sets Max value of Chart with offset of 100 to keep line visible
        minValue = (Math.min.apply(null, testArray) - 100); //Sets Min value of Chart with offset of 100 to keep line visible

        startPoints++;

        /****
         * Now that we have all the data processed, start drawing charts with it!
         ****/
        plotChart(chartArray); // main line chart
        piePower(current); // Donut-pie chart of power breakdown
        batteryStatus(current); // What is the battery currently doing
        //houseOutput(chartArray, startPoints); // I forgot what this does, probably should stop drinking & coding
        results = null;
    });
    function plotChart(chartData) {
        $('.output .solar').text("Solar: " + current.solar.toFixed(2) + "kW");
        $('.output .grid').text("Grid: " + current.grid.toFixed(2) + "kW");
        $('.output .batt').text("PWall: " + current.battery.toFixed(2) + "kW");
        var trackingData = [{
                data: chartData.battery,
                //label: 'PWall ' + current.battery.toFixed(2) + "kW",
                color: color.battery
            },
            {
                data: chartData.grid,
                //label: 'Grid ' + current.grid.toFixed(2) + "kW",
                color: color.grid
            },
            {
                data: chartData.solar,
                //label: 'Solar ' + current.solar.toFixed(2) + "kW",
                color: color.solar
            }
        ];
        $.plot('#tracking_chart', trackingData, {
            crosshair: {
                mode: 'x'
            },
            lines : {
              fill:0.05
            },
            grid: {
                hoverable: true,
                autoHighlight: false,
                borderWidth: 0,
                tickColor: '#0d0d0d'
            },
            yaxis: {
                color: '#0d0d0d',
                min: minValue,
                max: maxValue
            },
            xaxis: {
              tickLength: 0
             }
        });

        var legends = $('#tracking_chart .legendLabel');
        legends.each(function () {
            $(this).css('width', $(this).width());
        });
    }
}
//// END Flot Charts \\\\

//// START Current Output  \\\\
function batteryStatus(data) {
    var battData = data.battery;
    if (battData < -0.02) {
        $('#battery-status .number').text("Charging");
        $('#battery-status .material-icons').addClass("battery_charging");
    } else if ((battData >= -0.02) && (battData <= 0.02)) {
        $('#battery-status .number').text("Standby");
        $('#battery-status .material-icons').addClass("battery-full");
    } else if (battData > 0.02) {
        $('#battery-status .number').text("Discharging");
        $('#battery-status .material-icons').addClass("battery-full");
        if (ani < 7) {
            ani++;
            $('#battery-status .material-icons').addClass("animate" + ani);
        } else {
            $("#battery-status .material-icons").removeClass(function (index, className) {
                return (className.match(/(^|\s)animate\S+/g) || []).join(' ');
            });
            ani = 1;
        }
        $('#battery-status .material-icons').addClass("battery-discharging");
    }
    data = null;
}
function houseOutput(data, points) {
    data = data.house;
    var summedData;
    if (data.length == points) {
        summedData = data.reduce(add);
    } else if (summedData == (data.length + 100)) {
        summedData.push(data.reduce(add));
    } else {
        summedData = 0;
    }
    function add(accumulator, a) {
        return accumulator + a;
    }
}
//// END Current Output \\\\

//// START Breakdown Charts \\\\
function piePower(data) {
    reDraw();
    var pieChartData = [
        data.solar.toFixed(2),
        data.battery.toFixed(2),
        data.grid.toFixed(2)
    ];
    //var solarSavings = data.solar;

    var piLabels = ['Solar', 'Battery', 'Grid'];
    var pieChartSeries = 3;
    var pieChartColors = [color.solar, color.battery, color.grid];
    for (var i = 0; i < pieChartSeries; i++) {
        if (pieChartData[i] < 0) {
            pieChartData[i] = 0;
        } else if (pieChartData[i] > 100) {
            pieChartData[i] = 100;
        }
        pieChartData[i] = {
            label: piLabels[i],
            data: pieChartData[i],
            color: pieChartColors[i]
        };
    }
    if (data.solar > 0) {
        $('.solar-breakdown').css("display", "block");
        var solarOutput = (data.solar / maxSolar_kW) * 100;
        solarOutput = Math.abs(solarOutput);
        solarOutput = solarOutput.toFixed(1) + "%";
        drawBreakdown('.solar .progress-bar', solarOutput);
    }
    if (data.solar > data.house) {
        if (data.battery < 0) {
            var thisWidth = (data.battery / data.solar) * 100;
            thisWidth = Math.abs(thisWidth);
            thisWidth = thisWidth.toFixed(1) + "%";
            drawBreakdown('.battery .progress-bar', thisWidth);
        } else {
            drawBreakdown('.battery .progress-bar', "0");
        }
        if (data.house < data.solar) {
            var houseWidth = (data.house / data.solar) * 100;
            houseWidth = Math.abs(houseWidth);
            houseWidth = houseWidth.toFixed(1) + "%";
            drawBreakdown('.house .progress-bar', houseWidth);

        } else {
            drawBreakdown('.house .progress-bar', "0");
        }
        if (data.grid < 0) {
            var gridWidth = (data.grid / data.solar) * 100;
            gridWidth = Math.abs(gridWidth);
            gridWidth = gridWidth.toFixed(1) + "%";
            drawBreakdown('.grid .progress-bar', gridWidth);

        } else {
            drawBreakdown('.grid .progress-bar', "0");

        }
    } else {
        $('.solar-breakdown').css("display", "none");
    }
    $.plot('#pie_chart', pieChartData, {
        series: {
            pie: {
                show: true,
                radius: 1,
                innerRadius: 0.8,
                label: {
                    show: false,
                    radius: 3 / 4,
                    formatter: labelFormatter,
                    background: {
                        opacity: 0.5
                    }
                },
                stroke: {
                    width: 0
                }
            }
        },
        legend: {
            show: false
        }
    });
    function drawBreakdown(device, output) {
        $('.solar-breakdown').find(device).css("width", output);
    }
    function labelFormatter(label, series) {
        return '<div style="font-size:8pt; text-align:center; padding:2px; color:white;">' + label + '<br/>' + Math.round(series.percent) + '%</div>';
    }
    data = null;
}
//// END Breakdown Charts \\\\

//// START Cost-Savings Calculations \\\\
function getTodayData(callback) {
    var todaysHours = new Date().getHours();
    var minHrs = 60;
    var wattHours = {
        solar: {sum: 0,count: 0,hours: 0,Whr: 0},
        battery: {sum: 0,count: 0,hours: 0,Whr: 0},
        grid: {sum: 0,count: 0,hours: 0,Whr: 0},
        house: {sum: 0,count: 0,hours: 0,Whr: 0}
    }; // Object of todays calculates watt hours

    getData('', function(data) {
        for(n=0;n < data.length;n++) {
            wattHours.solar.sum = wattHours.solar.sum + Number(data[n].solar);
            wattHours.house.sum = wattHours.house.sum + Number(data[n].house);
            wattHours.grid.sum = wattHours.grid.sum + Number(data[n].grid);
            wattHours.battery.sum = wattHours.battery.sum + Number(data[n].battery);
            if (Number(data[n].solar) > 0) {
                wattHours.solar.count++;
            }
            if (Number(data[n].house) != 0) {
                wattHours.house.count++;
            }
            if (Number(data[n].grid) != 0) {
                wattHours.grid.count++;
            }
            if (Number(data[n].battery) != 0) {
                wattHours.battery.count++;
            }

        }
        //whCalc('solar');
        var housekWh = whCalc('house');
        var gridkWh = whCalc('grid');
        //whCalc('battery');
        var houseSavings = (housekWh - gridkWh) * gridCost;
        var gridDebit = gridCost * gridkWh;

        $('#cost-output .cost').text("Cost: $" + gridDebit.toFixed(2));
        $('#cost-output .savings').text("Savings: $" + houseSavings.toFixed(2));

        function whCalc(source) {
            wattHours[source].whr = wattHours[source].sum / wattHours[source].count;
            wattHours[source].whr = wattHours[source].whr * (wattHours[source].count / 60);
            wattHours[source].whr = wattHours[source].whr / 1000;
            return wattHours[source].whr;
        }
        data = null;
    });

    if(callback != null) {
        return( callback() );
    }else {
      return;
    }
}
