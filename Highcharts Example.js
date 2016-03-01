$(function () {
    $('#container').highcharts({
        chart: {
            type: 'column'
        },
        plotOptions: {
            column: {
                colorByPoint: true
            }
        },
        colors: [
            'red',
            'red',
            'blue',
           	'purple',
            'green'
        ],
        title: {
            text: 'Fruit Consumption'
        },
        xAxis: {
            categories: [
                'Living in America',
                'Lionel Richie',
                'Stevie Wonder',
                'James Brown',
                "No answer"
            ]
        },
        yAxis: {
            title: {
                text: 'Fruit eaten'
            }
        },
        series: [{
        		showInLegend: false,
            name: 'Jane',
            data: [1, 8, 4, 3, 1]
        }],
    });
});