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
    var nodeAPIserver = 'http://10.0.10.201:3301/api';
    //var nodeAPIapp = 'http://localhost:3301/api';
//// END Global Variables \\\\

//// Call to API functions \\\\
function getData(dataType, callback) {
  var dataStreams = nodeAPIserver;
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
//// END API Functions \\\\
function historicalChart(timeFrame) {
  if(timeFrame == "/day") {
    getData(timeFrame, function(data) {
      var barData = [
        {data: []},
        {data: []},
        {data:[]}
      ];
      var dPoints = 0,
            timeStamp = 0,
            battSum = 0,
            gridSum = 0,
            solarSum = 0,
            houseSum = 0;
          barStep = -1440; //Minutes in a day
          for(n=0;n < data.length;n++) {
            timeStamp = data[n].Created_date;
            timeStamp = new Date(timeStamp).getTime();
            battSum = Number(data[n].battery);
            gridSum = Number(data[n].grid);
            solarSum = Number(data[n].solar);
            houseSum = Number(data[n].house);
            barData[0].data.push([timeStamp, battSum]);
            barData[1].data.push([timeStamp, solarSum]);
            barData[2].data.push([timeStamp, gridSum]);

          }

          var trackedDay = [{
                  data: barData[0].data,
                  color: color.battery
              },{
                  data: barData[2].data,
                  color: color.grid
              },{
                  data: barData[1].data,
                  color: color.solar
              }];
          $.plot('#day_chart', trackedDay, {
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
                  color: '#0d0d0d'
              },
              xaxis: {
                tickLength: 0,
                mode: "time",
                twelveHourClock: true,
                timezone: "browser",
                timeBase: "milliseconds"
               }
          });
    });
  }else if(timeFrame == "/week"){

    var today = new Date();
    var lastWeek = [];
    var tempData = {
      batt:[],grid:[],house:[],solar:[]
    };
    //var weekAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    for(i=0;i<7;i++) {
      var iDate = new Date(new Date().setDate(new Date().getDate() - (i + 1)));
      lastWeek[i] = '/' + (iDate.getMonth() + 1) + '-' + iDate.getDate() + '-' + iDate.getFullYear();
    }
    drawDayGraph(lastWeek[0]);
    $('.day').attr('data_day', '0');

    $('.day').on('click', function(e) {
      e.stopPropagation();
      e.preventDefault();

      var btnData = $(this).attr('data_day');

      if(btnData != 6 && $(this).hasClass('prev')){
        btnData = Number(btnData) + 1;
      }else if(btnData != 0 && $(this).hasClass('next')) {
        btnData = Number(btnData) - 1;

      };
      $('.day').attr('data_day', btnData);
      drawDayGraph(lastWeek[btnData]);
    });
    function drawDayGraph(thisDay) {
      $('.date').text(thisDay);
      getData(thisDay, function(data) {
        var thisData = [
          {data: []},
          {data: []},
          {data:[]}
        ];

        var dPoints = 0,
              timeStamp = 0,
              battSum = 0,
              gridSum = 0,
              solarSum = 0,
              houseSum = 0;
              for(n=0;n < data.length;n++) {
                timeStamp = data[n].Created_date;
                timeStamp = new Date(timeStamp).getTime();
                battSum = Number(data[n].battery);
                gridSum = Number(data[n].grid);
                solarSum = Number(data[n].solar);
                houseSum = Number(data[n].house);
                thisData[0].data.push([timeStamp, battSum]);
                thisData[1].data.push([timeStamp, solarSum]);
                thisData[2].data.push([timeStamp, gridSum]);

              };
              var trackedDay = [{
                      data: thisData[0].data,
                      color: color.battery
                  },{
                      data: thisData[2].data,
                      color: color.grid
                  },{
                      data: thisData[1].data,
                      color: color.solar
                  }];
                  $.plot('#week_chart', trackedDay, {
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
                          color: '#0d0d0d'
                      },
                      xaxis: {
                        tickLength: 0,
                        mode: "time",
                        twelveHourClock: true,
                        timezone: "browser",
                        timeBase: "milliseconds"
                       }
                  });
      });
      return;
    }
  }
}
function weekCalc() {
  var getTime = {
    now:new Date(),
    next:new Date(),
    thisHour:'',
    nextHour:''
  }
  var tempData = {
    batt:[],grid:[],house:[],solar:[]
  };

  var nowTime = getTime.now;
  nowTime = nowTime.getDate();

  for(n=0;n < data.length;n++) {
    var thisDate = new Date(data[n].Created_date);
    thisDate = thisDate.getDate();
    //var lastWeek = nowTime - 7;

    if(thisDate == nowTime) {

    }

  }
  function sumData(data) {
    tempData.batt[n] = Number(data[n].battery);
    tempData.grid[n] = Number(data[n].grid);
    tempData.house[n] = Number(data[n].house);
    tempData.solar[n] = Number(data[n].solar);
  };


    getTime.thisHour = thisDate.getHours();
    //sum all data for hour = n //


    /*for(n=0;n < data.length;n++) {
      var thisDate = data[n].Created_date;
      if(n+1 != data.length){
        var nextTime = data[n+1].Created_date;
      }else {
        var nextTime = thisDate;
      }
      thisDate = new Date(thisDate);
      nextTime = new Date(nextTime);
      var getTime = {
        today:thisDate.getDay(),
        tomorrow:nextTime.getDay(),
        thisHour:thisDate.getHours(),
        nextHour:nextTime.getHours()
      }

    }*/

    /*for(n=0;n < data.length;n++) {
      var thisDate = data[n].Created_date;

      if(n+1 != data.length){
        var nextTime = data[n+1].Created_date;
      }else {
        var nextTime = thisDate;
      }
      thisDate = new Date(thisDate);
      nextTime = new Date(nextTime);



      if(getTime.today == getTime.tomorrow){

        if(thisHour == nextHour) {
          battSum = battSum + Number(data[n].battery);
          gridSum = gridSum + Number(data[n].grid);
          solarSum = solarSum + Number(data[n].solar);
          houseSum = houseSum + Number(data[n].house);
          dPoints++;
        }else {
          console.log("solar: " + solarSum);


          houseSum = ((houseSum / dPoints))/1000;
          battSum = ((battSum / dPoints)) /1000;
          gridSum = ((gridSum / dPoints))/1000;
          solarSum = ((solarSum / dPoints))/1000;

        }
      }else {
        console.log("=========");
        console.log("day: " + thisDay);
        console.log("summed solar: " + solarSum);
        console.log("data Points: " + dPoints);
        /// push summed kWh to day's array
        barData[0].data.push([barStep, battSum]);
        barData[1].data.push([barStep, solarSum]);
        barData[2].data.push([barStep, gridSum]);
        barStep++;
        dPoints = 0;
      }
    }*/

    /* varChartID = '#week_chart';
    stacked = false;
    $.plot(varChartID, barData, {
        series: {
            stack: stacked,
            bars: {
                show: true,
                barWidth: 0.2,
                lineWidth: 0,
                order: 1,
                fillColor: {
                  colors: [{
                      opacity: 0.8
                  }, {
                      opacity: 0.8
                  },{
                      opacity: 0.8
                  },{
                      opacity: 0.8
                  }]
              }
            }

        },
        xaxis: {
            mode: "categories",
            tickLength: 0
        },
        yaxis: {
            color: '#0d0d0d',
        },
        grid: {
            hoverable: true,
            autoHighlight: false,
            borderWidth: 0,
            tickColor: '#0d0d0d'
        },
        colors: [color.battery, color.solar, color.grid]
    });
    */

}

//// END Flot Charts \\\\

//// START Current Output  \\\\
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
      //console.log("data: " + data);
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
        // $168/mo for panels, $116/mo for PowerWalls = $284/mo for loans

        var houseSavings = (housekWh - gridkWh) * gridCost;
        var gridDebit = gridCost * gridkWh;

        $('#cost-output .cost').text("Grid Cost: $" + gridDebit.toFixed(2));
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
