var sampleUIDKey = "uid";
var sampleFinalContribKey = "fin_contrib";
var sampleThroughputKey = "throuput";
var samplePathsCountKey = "paths_count";
var sampleTotalProbabilityKey = "tot_prob";

/**
 * Constructor for the SamplesChart
 *
 * @param _shiftChart
 */
function SamplesChart(_pathsChart) {
    var self = this;
    self.pathsChart = _pathsChart;
    self.init();
}
/**
 * Initializes the svg elements required for this chart
 */
SamplesChart.prototype.init = function () {
    var self = this;
    self.pixel;
    self.samplesOrig;
    self.samples;
    self.modified = false;
    var legendHeight = 30;


    var self = this;
    //Gets access to the div element created for this chart from HTML
    self.divOuter = d3.select("#samples-chart-outer");
    self.svgBounds = self.divOuter.node().getBoundingClientRect();
    self.svgWidth = self.svgBounds.width;
    self.svgHeight = self.svgBounds.height;
    //creates svg element within the div
    self.chartSVG = self.divOuter.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight)

    var legend = d3.select("#legend");
    self.legendSvg = legend.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", legendHeight);

    $('#sort-ascending').on("click", function () {
        self.sort('a');
    });

    $('#sort-descending').on("click", function () {
        self.sort('d');
    });

    $('#sort-reset').on("click", function () {
        self.sort('r');
    });





    $('#samples-chart-container').hide();
};


SamplesChart.prototype.getData = function (_pixel) {
    var self = this;
    self.pixel = _pixel;

    self.modified = false;

    // Get the samples data and update the chart
    if (demo) {
        d3.json("data/samples.json", function (error, _samples) {
            $('#samples-chart-container').show();
            self.samplesOrig = _samples['samples'];
            self.pixelInfo();
            self.update();
        });
    }
    else {
        d3.json("REQUESTP_ORTAL", function (error, _samples) {
            self.samplesOrig = _samples['samples'];
            self.pixelInfo();
            self.update();
        });
    }
};

SamplesChart.prototype.update = function () {
    var self = this;

    if (!self.modified)
        self.samples = self.samplesOrig.slice(0);

    var bars = self.chartSVG.selectAll('rect')
        .data(self.samples);

    bars.exit().remove();

    var barsEnter = bars.enter()
        .append('rect');

    bars = bars.merge(barsEnter);

    var barWidth = self.svgWidth / self.samples.length;

    var maxFinContrib = d3.max(self.samples, function (d) {
        return d[sampleFinalContribKey];
    });

    var yScale = d3.scaleLinear()
        .range([self.svgHeight - 20, 0])
        .domain([0, maxFinContrib]);

    var xScale = d3.scaleBand()
        .range([0, self.svgWidth])
        .domain(self.samples.map(function (d) {
            return d[sampleUIDKey];
        }));

    var colorScale = d3.scaleQuantile()
        .range(["#0066CC", "#0080FF", "#3399FF", "#66B2FF","#ff6666", "#ff3333", "#FF0000", "#CC0000"])
        .domain([0, maxFinContrib]);

    var legendQuantile = d3.legendColor()
        .shapeWidth(self.svgWidth/8 -2)
        .shapeHeight(5)
        .cells(10)
        .orient('horizontal')
        .scale(colorScale);

    var legend = self.legendSvg.selectAll(".legendQuantile")
        .data([1]);

    legend.exit().remove();

    var legendWidth = self.svgWidth / (1.4);

    var legendEnter = legend.enter()
        .append("g")
        .attr("class", "legendQuantile")
        .call(legendQuantile);
        // .attr("transform", function () {
        //     var scale = "scale(" + (legendWidth / (122 * colorScale.range().length)) + ")";
        //     var translate = "translate(" + ((self.svgWidth - legendWidth) / 2) + ", 0)";
        //     return translate + " " + scale;
        // });

    legend = legend.merge(legendEnter);

    bars
        .attr("x", function (d) {
            return xScale(d[sampleUIDKey]);
        })
        .attr("y", function (d) {
            return yScale(d[sampleFinalContribKey]);
        })
        .attr("width", barWidth-2)
        .attr("height", function (d) {
            return self.svgHeight - yScale(d[sampleFinalContribKey]);
        })
        .attr('fill', function (d) {
            return colorScale(d[sampleFinalContribKey]);
        });
};

SamplesChart.prototype.pixelInfo = function () {
    var self = this;

    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function color(x) {
        var mid = 255 / 2;
        if (x.r) {
            if (x.r >= mid && x.g >= mid && x.b >= mid)
                return 'black';
            else
                return 'white';
        }
        else if (x >= mid)
            return 'white';
        else
            return 'black';
    }

    $('#pixelX').text(self.pixel.x);
    $('#pixelY').text(self.pixel.y);

    var pixelColor = "#" + hex(self.pixel.colorR) + hex(self.pixel.colorG) + hex(self.pixel.colorB);

    $('#pixelCol').css("background", pixelColor);
    $('#pixelCol').css("color", color(hexToRgb(pixelColor)));
    $('#pixelCol').text(pixelColor.toUpperCase());

    $('#pixelRed').css("background", "rgba(255, 0, 0, " + self.pixel.colorR / 255 + ")");
    $('#pixelRed').text(self.pixel.colorR);
    $('#pixelRed').css("color", color(self.pixel.colorR));

    $('#pixelGreen').css("background", "rgba(0, 255, 0, " + self.pixel.colorG / 255 + ")");
    $('#pixelGreen').text(self.pixel.colorG);
    $('#pixelGreen').css("color", color(self.pixel.colorG));

    $('#pixelBlue').css("background", "rgba(0, 0, 255, " + self.pixel.colorB / 255 + ")");
    $('#pixelBlue').text(self.pixel.colorB);
    $('#pixelBlue').css("color", color(self.pixel.colorB));
};

SamplesChart.prototype.sort = function (param) {
    var self = this;
    switch (param) {
        case 'r':
            self.modified = false;
            self.samples = self.samplesOrig.slice(0);
            break;
        case 'a':
            self.modified = true;
            self.samples = self.samples.sort(function (a,b) {return d3.ascending(a[sampleFinalContribKey], b[sampleFinalContribKey]); });
            break;
        case 'd':
            self.modified = true;
            self.samples = self.samples.sort(function (a,b) {return d3.descending(a[sampleFinalContribKey], b[sampleFinalContribKey]); });
            break;
    }
    self.update();
};
