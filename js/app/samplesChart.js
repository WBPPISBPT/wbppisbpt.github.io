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


    //Gets access to the div element created for this chart from HTML
    self.divOuter = d3.select("#samples-chart-outer");
    self.svgBounds = self.divOuter.node().getBoundingClientRect();
    self.svgWidth = self.svgBounds.width;
    self.svgHeight = self.svgBounds.height;
    //creates svg element within the div
    self.chartSVG = self.divOuter.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight)

    var legendHeight = 30;

    var legend = d3.select("#legend");
    self.legendSvg = legend.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", legendHeight);

    self.axisWidth = 24;
    self.axisBottomMargin = 13;

    $('#sort-ascending').on("click", function () {
        self.modifyData('sa');
    });

    $('#sort-descending').on("click", function () {
        self.modifyData('sd');
    });

    $('#sort-reset').on("click", function () {
        self.modifyData('sr');
    });

    $('#samples-chart-wrapper').on("contextmenu", function () {
        return false;
    });

    $('#samples-chart-container').hide();
};


SamplesChart.prototype.getData = function (_pixel) {
    var self = this;
    if (self.pixel == undefined || self.pixel.x != _pixel.x || self.pixel.y != _pixel.y) {
        self.pixel = _pixel;
        self.modified = false;

        console.log('SamplesChart.getData was called for pixel: ', _pixel.x, _pixel.y);
        //console.log('SamplesChart.getData trying to get samples.json');
        // Get the samples data and update the chart
        if (demo) {
            d3.json("data/samples.json", function (error, _samples) {
                $('#samples-chart-container').show();
                console.log('SamplesChart.getData received data: ', _samples);
                self.samplesOrig = _samples['samples'];
                self.pixelInfo();
                self.update();
            });
        } else {
            self.pixelInfo();

            $('#samples-chart-container').show();
            $('.wait1').show();

            //return;

            let query = {
                "pixel_i": _pixel.x,
                "pixel_j": _pixel.y
            };

            let send_data = {
                "query_string": JSON.stringify(query)
            };

            $.ajax({
                type: "GET"
                    ,
                url: database_URI + '/getFromCollection/Samples'
                    ,
                success: function (data, textStatus, jqXHR) {
                    console.log(textStatus)
                    console.log("Got pixel sample values");
                    console.log(data)
                    
                    results = [];
                    data.forEach(function(d){
                        results.push({
                            fin_contrib: Math.sqrt(d.value.r*d.value.r + d.value.g*d.value.g + d.value.b*d.value.b),
                            uid: d.uid,
                            r: d.value.r,
                            g: d.value.g,
                            b: d.value.b
                        });
                    });

                    console.log("Pixel samples")
                    console.log(results)

                    self.samplesOrig = results;
                    $('.wait1').hide();
               
                    self.update();
                }
                    ,
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(textStatus);
                    console.log(jqXHR);
                    console.log(errorThrown);
                }
                    ,
                data: send_data
            });
        }
    }
};

SamplesChart.prototype.update = function () {
    var self = this;

    if (!self.modified)
        self.samples = self.samplesOrig.slice(0);

    self.maxFinContrib = d3.max(self.samples, function (d) {
        return d[sampleFinalContribKey];
    });

    self.minFinContrib = d3.min(self.samples, function (d) {
        return d[sampleFinalContribKey];
    });

    self.yScale = d3.scaleLinear()
        .range([self.svgHeight - 10, 10])
        .domain([0, self.maxFinContrib]);

    self.xScale = d3.scaleBand()
        .range([self.axisWidth + 1, self.svgWidth])
        .domain(self.samples.map(function (d) {
            return d[sampleUIDKey];
        }));

    self.colorScale = d3.scaleQuantile()
        .range(["#0066CC", "#0080FF", "#3399FF", "#66B2FF", "#ff6666", "#ff3333", "#FF0000", "#CC0000"])
        .domain([self.minFinContrib, self.maxFinContrib]);

    self.setupLegend();
    self.setupAxis('y');
    self.setupAxis('x');
    self.setupBars();
    self.setupMean();
};

SamplesChart.prototype.setupLegend = function () {
    var self = this;

    var legendQuantile = d3.legendColor()
        .shapeWidth((self.svgWidth - self.axisWidth) / 8 - 1)
        .shapeHeight(5)
        .cells(10)
        .orient('horizontal')
        .scale(self.colorScale)
        .labelFormat(d3.format(".02f"));

    self.legendSvg.selectAll(".legendQuantile").remove();

    var legend = self.legendSvg.selectAll(".legendQuantile")
        .data([1]);

    legend.exit().remove();

    var legendEnter = legend.enter()
        .append("g")
        .attr("class", "legendQuantile")
        .call(legendQuantile)
        .attr("transform", "translate(" + self.axisWidth + ", 0)");

    legend = legend.merge(legendEnter);
};

SamplesChart.prototype.setupAxis = function (param) {
    var self = this;

    var className;
    var axisFunction;
    param == 'y' ? className = 'y-axis' : className = 'x-axis';

    var xAxisScale = d3.scaleLinear()
        .range([5, self.svgWidth - self.axisWidth - 3]);

    if (param == 'y') {
        axisFunction = d3.axisLeft();
        axisFunction.scale(self.yScale);
    } else {
        axisFunction = d3.axisBottom();
        axisFunction.scale(xAxisScale);
        axisFunction.ticks(0);
        axisFunction.tickSize(0);
    }

    var axis = self.chartSVG.selectAll('.' + className)
        .data([1]);

    axis.exit().remove();

    var axisEnter = axis.enter()
        .append("g")
        .attr("class", className);

    axis = axis.merge(axisEnter);

    axis.call(axisFunction)
        .attr("transform", function () {
            if (param == 'y') {
                return "translate(" + self.axisWidth + ", 10)";
            } else {
                var translate = "translate(";
                translate += self.axisWidth;
                translate += ", ";
                translate += (self.svgHeight - self.yScale(self.maxFinContrib) - 10);
                translate += ")";
                return translate;
            }
        });
};

SamplesChart.prototype.setupBars = function () {
    var self = this;
    var bars = self.chartSVG.selectAll('.bar')
        .data(self.samples);

    bars.exit().remove()
        .attr('fill', function (d) {
            return self.colorScale(d[sampleFinalContribKey]);
        });

    var barsEnter = bars.enter()
        .append('rect')
        .classed('bar', true);

    bars = bars.merge(barsEnter);

    var barWidth = (self.svgWidth - self.axisWidth) / self.samples.length;

    bars
        .attr("x", function (d) {
            return self.xScale(d[sampleUIDKey]);
        })
        .attr("y", function (d) {
            return self.yScale(d[sampleFinalContribKey]) - 10;
        })
        .attr("width", barWidth - 2)
        .attr("height", function (d) {
            return self.svgHeight - self.yScale(d[sampleFinalContribKey]);
        })
        .attr('style', 'cursor: pointer;')
        .attr('fill', function (d) {
            return self.colorScale(d[sampleFinalContribKey]);
        })
        .on('click', function (d) {
            self.updatePathsChart(d);
        })
        .on('contextmenu', function (d, i) {
            if (self.samples.length > 1) {
                self.modifyData('r', i);
                self.recordRemovedPixel(d);
            }
            return false;
        });
};
SamplesChart.prototype.setupMean = function () {
    var self = this;

    var mean = d3.mean(self.samples, function (d) {
        return +d[sampleFinalContribKey];
    });

    d3.select('.mean').remove();
    d3.select('.meanText').remove();

    var meanBar = self.chartSVG.selectAll('.mean')
        .data([mean]);

    var meanText = self.chartSVG.selectAll('.meanText')
        .data([mean]);

    var meanBarWidth = (self.svgWidth - self.axisWidth);

    meanBar.enter()
        .append('rect')
        .classed('mean', true)
        .attr("x", function (d) {
            return self.axisWidth;
        })
        .attr("y", function (d) {
            return self.yScale(d) + 10;
        })
        .attr("width", meanBarWidth - 2)
        .attr("height", function (d) {
            return 1;
        })
        .attr('fill', 'rgba(0, 0, 0, 0.8)');

    var format = d3.format(".02f");

    meanText.enter()
        .append('text')
        .classed('meanText', true)
        .attr("x", function (d) {
            return self.axisWidth + 5;
        })
        .attr("y", function (d) {
            return self.yScale(d) + 10;
        })
        .text(function (d) {
            return 'Samples Mean: ' + format(d);
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "1em")
        .attr("font-weight", "bold")
        .attr("alignment-baseline", function (d) {
            if (d == self.maxFinContrib) {
                return 'before-edge';
            }
            return 'after-edge';
        })
        .attr('fill', 'rgba(0, 0, 0, 0.8)');
};

SamplesChart.prototype.recordRemovedPixel = function (d) {
    var self = this;
    var pixel = self.pixel.x + '-' + self.pixel.y;
    if (!removedSamples[pixel]) {
        removedSamples[pixel] = {};
    }
    removedSamples[pixel][d[sampleUIDKey]] = d;
};

SamplesChart.prototype.updatePathsChart = function (sample) {
    var s = this;
    console.log('SamplesChart trying to update PathsChart with the following sample object:');
    console.log(sample);
    s.pathsChart.getData(sample);
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
        } else
            return 'white';
    }

    $('#pixelX').text('X: ' + self.pixel.x);
    $('#pixelY').text('Y: ' + self.pixel.y);

    var pixelColor = "#" + hex(self.pixel.colorR) + hex(self.pixel.colorG) + hex(self.pixel.colorB);

    $('#pixelCol').css("background", pixelColor);
    $('#pixelCol').css("color", color(hexToRgb(pixelColor)));
    $('#pixelCol').text(pixelColor.toUpperCase());

    $('#pixelRed').css("background", "rgba(" + self.pixel.colorR + ", 0, 0, 1)");
    $('#pixelRed').text('R:' + self.pixel.colorR);
    $('#pixelRed').css("color", color(self.pixel.colorR));

    $('#pixelGreen').css("background", "rgba(0," + self.pixel.colorG + ", 0, 1)");
    $('#pixelGreen').text('G:' + self.pixel.colorG);
    $('#pixelGreen').css("color", color(self.pixel.colorG));

    $('#pixelBlue').css("background", "rgba(0, 0," + self.pixel.colorB + ", 1)");
    $('#pixelBlue').text('B:' + self.pixel.colorB);
    $('#pixelBlue').css("color", color(self.pixel.colorB));
};

SamplesChart.prototype.modifyData = function (param, index) {
    // sr: sort reset
    // sa: sort ascending
    // sd: sort descending
    // r: remove element
    var self = this;
    switch (param) {
        case 'sr':
            self.modified = false;
            self.samples = self.samplesOrig.slice(0);
            break;
        case 'sa':
            self.modified = true;
            self.samples = self.samples.sort(function (a, b) {
                return d3.ascending(a[sampleFinalContribKey], b[sampleFinalContribKey]);
            });
            break;
        case 'sd':
            self.modified = true;
            self.samples = self.samples.sort(function (a, b) {
                return d3.descending(a[sampleFinalContribKey], b[sampleFinalContribKey]);
            });
            break;
        case 'r':
            self.modified = true;
            self.samples.splice(index, 1);
            break;
    }
    self.update();
};