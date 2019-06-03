var token;
var products;
var pwID;
var liveData;
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

/****
*
*  An oject for calculating total cost of kWh delevered by Utility.
*  Edit as needed to mirror your utility bill.
*
****/
var utilCosts = {
  delivery: {
    customerFlat: 7.90,
    statekWh: 0.00736,
    distributionkWh: 0.03202,
    eriInititivekWh: 0.00024
  },
  fees: {
    svsProgFlat: 0.36,
    enviromentChgkWh: 0.000146,
    taxkWh: 0.00062
  },
  utility: {
    gridCostkWh: 0.132
  }
};
var gridCost = utilCosts.delivery.statekWh
          + utilCosts.delivery.distributionkWh
          + utilCosts.delivery.eriInititivekWh
          + utilCosts.fees.enviromentChgkWh
          + utilCosts.fees.taxkWh
          + utilCosts.utility.gridCostkWh;
//var gridCost = 0.18085128; // Cost of Grid use $$$/kWh

/**************
 * Address to your NodeJS app.js API server
 * This should be an address the client accessing the UI can access
 * Example: 127.0.0.1:#{port address}/#{folder set in routes.js}
**************/
var nodeAPIaddr = 'http://10.0.10.201:3301/api';
var localAPIaddr = 'http://10.0.10.202:3301/api';

//// END Global Variables \\\\
$(function () {
  setTimeout(function () {
        $('.page-loader-wrapper').fadeOut();
    }, 50);
    getToken(function() {
      //console.log(token);
      //getTodayData();
      //buildChart();
      setInterval(buildChart, 1500);
    });
    getTodayData();
    $(window).resize(reDraw());
    $('a').on('click', function(e) {
      e.preventDefault();
      var thisLink = $(this).attr('href');
      btnListen(thisLink);
    });
});
function btnListen(btnLink) {
  if(btnLink == "#data_live"){
    $('.flot-chart').removeClass("showme");
    $('.day').removeClass("showme");
    $('.date').text('');
    $('#live_chart').addClass("showme");
  }else if(btnLink == "#data_day"){
    $('.flot-chart').removeClass("showme");
    $('.day').removeClass("showme");
    $('.date').text('');
    $('#day_chart').addClass("showme");
    historicalChart("/day");
  }else if(btnLink == "#data_week"){
    $('.flot-chart').removeClass("showme");
    $('.day').addClass('showme');
    $('#week_chart').addClass("showme");
    historicalChart("/week");
  }
}
function reDraw() {
    var pieHeight = $('#pie_chart').width();
    $('#pie_chart').css('height', pieHeight);
}
function getToken(callback) {
  if(token == undefined) {
    $.ajax('/api/token').done(function (response) {
      token = JSON.parse(response);
      getProducts(function() {
        if(callback != undefined) {
          callback();
        }
      });

    });
  }else {
    getProducts();
  }

}
function getProducts(callback) {
  if(token == undefined) {
    getToken();
  }else {
    $.ajax('api/products/' + token.access_token).done(function (response) {
      products = JSON.parse(response);
      pwID = products.response[1].energy_site_id;
      getPowerData('energy_sites',pwID,'live_status');
      if(callback != undefined) {
        callback();
      }
    });
  }
}
function getPowerData(prodType,prodID,dataType) {
  if(token == undefined || products == undefined) {
    getToken();
  }else {
    var url = 'api/tesla/'+ token.access_token +'/'+ prodType +'/'+ prodID +'/' + dataType;
    $.ajax(url).done(function (data) {
      liveData = JSON.parse(data);
      liveData = liveData.response;
      return liveData;
    });
  }
}

function streamPWApi(dataType, callback) {
    /****
     * Gets data stream directly from the powerwall API
     * via your API middleware thowarting CORS issues
     * with Tesla SSL Settings
     ****/

    var pwAPIAddr = localAPIaddr + '/tesla/' + token.access_token + '/energy_sites/' + pwID + '/live_status';
    //var pwAPIAddr = 'https://10.0.10.220/api/meters/aggregates'
    if (dataType == 'undefined') {
        dataType = 'meters';
    }
    var dataStreams = [pwAPIAddr];
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
              var houseOutput = returndata.response.load_power / 1000;
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
     if(token == '') {
       getToken(function() {
         buildChart();
       });
     }else {
       streamPWApi('meters', function (results) {
         results = results.response;

         var battLevel = results.percentage_charged;
         var battLeft = results.energy_left / 1000;
         var discharge = 100 - battLevel;
         $('#battery-level .chart.chart-pie').text(discharge + "," + battLevel);
         $('#battery-level .number').text(battLeft.toFixed(3)+ " kWh");
         $('.chart.chart-pie').sparkline(undefined, {
             type: 'pie',
             height: '50px',
             sliceColors: ['rgba(0,0,0,0.10)', 'rgba(255,255,255,0.25)']
         });


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
           var thisDate = new Date(results.timestamp).getTime();
           chartArray.battery.push([thisDate, results.battery_power]);
           chartArray.house.push([thisDate, results.load_power]);
           chartArray.solar.push([thisDate, results.solar_power]);
           chartArray.grid.push([thisDate, results.grid_power]);

           /****
            * Add the results to a current array for displaying current live data
            ****/
           current.solar = (results.solar_power / 1000);
           current.battery = (results.battery_power / 1000);
           current.grid = (results.grid_power / 1000);
           current.house = (results.load_power / 1000);

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
           results = null;
       });
       function plotChart(chartData) {
           $('.output .solar').text("Solar: " + current.solar.toFixed(2) + "kW");
           $('.output .grid').text("Grid: " + current.grid.toFixed(2) + "kW");
           $('.output .batt').text("PWall: " + current.battery.toFixed(2) + "kW");
           if($('#live_chart').hasClass("showme")) {
             var trackingData = [{
                     data: chartData.battery,
                     color: color.battery
                 },{
                     data: chartData.grid,
                     color: color.grid
                 },{
                     data: chartData.solar,
                     color: color.solar
                 }];
             $.plot('#live_chart', trackingData, {
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
                   tickLength: 0,
                   mode: "time",
                   twelveHourClock: true,
                   timezone: "browser",
                   timeBase: "milliseconds"
                  }
             });
           }
       }
     }
}
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
function batteryStatus(data) {
    var battData = data.battery;
    //var houseData = determine time can be on battery
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
