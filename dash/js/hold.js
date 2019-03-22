



function initCharts() {
    $('.chart.chart-bar').sparkline(undefined, {
        type: 'bar',
        barColor: 'rgba(0, 0, 0, 0.15)',
        negBarColor: 'rgba(0, 0, 0, 0.15)',
        barWidth: '8px',
        height: '34px'
    });
    /*callPWapi('system_status', function(data) {
        var battLevel = data.percentage;
        var discharge = 100 - battLevel;
        $('#battery-level .chart.chart-pie').text(discharge + "," + battLevel);
        $('#battery-level .number').text(battLevel.toFixed(1)+ " %");
        $('.chart.chart-pie').sparkline(undefined, {
            type: 'pie',
            height: '50px',
            sliceColors: ['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.25)']
        });
    });*/


}

function analCost() {
    getTodayData(function (results) {

        var totalSolar,
            totalGrid,
            totalHouse,
            totalBattery,
            kWhSolar,
            kWhGrid,
            kWhHouse,
            kWhBattery,
            totalHours;
        totalHours = new Date();
        totalHours = totalHours.getHours();
        for (n = 0; n < results.length; n++) {
            totalSolar = totalSolar + results[n].solar;
            totalGrid = totalGrid + results[n].grid;
            totalHouse = totalHouse + results[n].house;
            totalBattery = totalBattery + results[n].battery;
            if (n == (results.length - 1)) {
                kWhSolar = (totalSolar / n) * totalHours;
                kWhGrid = (totalGrid / n) * totalHours;
                kWhHouse = (totalHouse / n) * totalHours;
                kWhBattery = (totalBattery / n) * totalHours;
            }
        }
        //console.log(kWhSolar);
    });
}

