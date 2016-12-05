var samplesQuery = 'samples-json/';
var sampleUIDKey = "uid";
var sampleFinalContribKey = "fin_contrib";
var sampleRKey = "r";
var sampleGKey = "g";
var sampleBKey = "b";
var sampleThroughputKey = "throuput";
var samplePathsCountKey = "paths_count";
var sampleTotalProbabilityKey = "tot_prob";

/**
 * Constructor for the SamplesChart
 *
 * @param _shiftChart
 */
function SamplesChart(_pathsChart) {
    var s = this;
    s.pathsChart = _pathsChart;
    s.init();
}

/**
 * Initializes the svg elements required for this chart
 */
SamplesChart.prototype.init = function () {
    var s = this;
    s.pixel;
    s.samplesOrig;
    s.samples;
    s.modified = false;
    //Gets access to the div element created for this chart from HTML
    s.divOuter = d3.select("#samples-chart-outer");
    s.svgBounds = s.divOuter.node().getBoundingClientRect();
    s.svgWidth = s.svgBounds.width;
    s.svgHeight = s.svgBounds.height;
    //creates svg element within the div
    s.chartSVG = s.divOuter.append("svg")
        .attr("width", s.svgWidth)
        .attr("height", s.svgHeight)
    var legendHeight = 30;
    var legend = d3.select("#legend");
    s.legendSvg = legend.append("svg")
        .attr("width", s.svgWidth)
        .attr("height", legendHeight);
    s.axisWidth = 40;
    s.axisBottomMargin = 13;
    $('#sort-ascending').on("click", function () {
        s.modifyData('sa');
    });
    $('#sort-descending').on("click", function () {
        s.modifyData('sd');
    });
    $('#sort-reset').on("click", function () {
        s.resetRemovedSample();
        s.modifyData('sr');
    });
    $('#samples-chart-wrapper').on("contextmenu", function () {
        return false;
    });
    $('#samples-chart-container').hide();
};

SamplesChart.prototype.getData = function (_pixel) {
    var s = this;
    if (s.pixel == undefined || s.pixel.x != _pixel.x || s.pixel.y != _pixel.y) {
        s.pixel = _pixel;
        s.modified = false;
        var filename = 'S-' + _pixel.x + '-' + _pixel.y + '.json';
        // Get the samples data and update the chart
        if (demo) {
            d3.json("data/samples.json", function (error, _samples) {
                $('#paths-chart-container').fadeOut(350, 'linear');
                $('#samples-chart-container').fadeIn(350, 'linear', function () {
                    $('html, body').animate({
                        scrollTop: $("#samples-chart-container").offset().top
                    }, 200);
                });
                s.clearMean();
                s.samplesOrig = _samples['samples'];
                s.pixelInfo();
                s.update();
            });
        }
        else {
            d3.json(server + samplesQuery + filename, function (error, _samples) {
                $('#paths-chart-container').fadeOut(350, 'linear');
                $('#samples-chart-container').fadeIn(350, 'linear', function () {
                    $('html, body').animate({
                        scrollTop: $("#samples-chart-container").offset().top
                    }, 200);
                });
                s.clearMean();
                s.samplesOrig = _samples['samples'];
                s.pixelInfo();
                s.update();
            });
        }
    }
};

SamplesChart.prototype.update = function () {
    var s = this;
    d3.selectAll('.d3-tip-sample').remove();
    if (!s.modified) {
        s.samples = s.samplesOrig.slice(0);
        s.clearMean();
    }
    s.maxFinContrib = d3.max(s.samples, function (d) {
        return d[sampleFinalContribKey];
    });
    s.minFinContrib = d3.min(s.samples, function (d) {
        return d[sampleFinalContribKey];
    });
    s.bottomMargin = 20;
    s.yScale = d3.scaleLinear()
        .range([s.svgHeight - s.bottomMargin, 0])
        .domain([0, s.maxFinContrib]);
    s.xScale = d3.scaleBand()
        .range([s.axisWidth + 1, s.svgWidth])
        .domain(s.samples.map(function (d) {
            return d[sampleUIDKey];
        }));
    s.colorScale = d3.scaleQuantile()
        .range(["#0066CC", "#0080FF", "#3399FF", "#66B2FF", "#ff6666", "#ff3333", "#FF0000", "#CC0000"])
        .domain([s.minFinContrib, s.maxFinContrib]);
    s.setupLegend();
    s.setupAxis('y');
    s.setupAxis('x');
    s.setupBars();
    s.setupMean();
};

SamplesChart.prototype.setupLegend = function () {
    var s = this;
    var legendQuantile = d3.legendColor()
        .shapeWidth((s.svgWidth - s.axisWidth) / 8 - 1)
        .shapeHeight(5)
        .cells(10)
        .orient('horizontal')
        .scale(s.colorScale)
        .labelFormat(d3.format(".02f"));
    s.legendSvg.selectAll(".legendQuantile").remove();
    var legend = s.legendSvg.selectAll(".legendQuantile")
        .data([1]);
    legend.exit().remove();
    var legendEnter = legend.enter()
        .append("g")
        .attr("class", "legendQuantile")
        .call(legendQuantile)
        .attr("transform", "translate(" + s.axisWidth + ", 0)");
    legend = legend.merge(legendEnter);
};

SamplesChart.prototype.setupAxis = function (param) {
    var s = this;
    var className;
    var axisFunction;
    param == 'y' ? className = 'y-axis' : className = 'x-axis';
    var xAxisScale = d3.scaleLinear()
        .range([0, s.svgWidth - s.axisWidth - 3]);
    if (param == 'y') {
        axisFunction = d3.axisLeft();
        axisFunction.scale(s.yScale);
    }
    else {
        axisFunction = d3.axisBottom();
        axisFunction.scale(xAxisScale);
        axisFunction.ticks(0);
        axisFunction.tickSize(0);
    }
    var axis = s.chartSVG.selectAll('.' + className)
        .data([1]);
    axis.exit().remove();
    var axisEnter = axis.enter()
        .append("g")
        .attr("class", className);
    axis = axis.merge(axisEnter);
    axis.call(axisFunction)
        .attr("transform", function () {
            if (param == 'y') {
                return "translate(" + s.axisWidth + ", 10)";
            }
            else {
                var translate = "translate(";
                translate += s.axisWidth;
                translate += ", ";
                translate += (s.svgHeight - s.yScale(s.maxFinContrib) - 10);
                translate += ")";
                return translate;
            }
        });
};

SamplesChart.prototype.setupBars = function () {
    var s = this;
    var bars = s.chartSVG.selectAll('.bar')
        .data(s.samples);
    bars.exit().remove()
        .attr('fill', function (d) {
            return s.colorScale(d[sampleFinalContribKey]);
        });
    var barsEnter = bars.enter()
        .append('rect')
        .classed('bar', true);
    bars = bars.merge(barsEnter);
    var barWidth = (s.svgWidth - s.axisWidth) / s.samples.length;
    var tip = d3.tip()
        .attr('class', 'd3-tip d3-tip-sample')
        .html(function (d) {
            return '<strong>ID: </strong>' + d[sampleUIDKey] + '<br>' +
                '<strong>Contribution: </strong>' + d[sampleFinalContribKey] + '<br>' +
                '<strong>R: </strong>' + d[sampleRKey] + '<br>' +
                '<strong>G: </strong>' + d[sampleGKey] + '<br>' +
                '<strong>B: </strong>' + d[sampleBKey];
        })
        .offset([-7, 0]);
    bars.call(tip);
    bars
        .on('click', function (d) {
            s.updatePathsChart(d);
        })
        .on('contextmenu', function (d, i) {
            if (s.samples.length > 1) {
                s.modifyData('r', i);
                s.recordRemovedSample(d);
            }
            return false;
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .transition()
        .attr("x", function (d) {
            return s.xScale(d[sampleUIDKey]);
        })
        .attr("y", function (d) {
            return s.yScale(d[sampleFinalContribKey]) + 10;
        })
        .attr("width", barWidth - 2)
        .attr("height", function (d) {
            return s.svgHeight - s.yScale(d[sampleFinalContribKey]) - s.bottomMargin;
        })
        .attr('style', 'cursor: pointer;')
        .attr('fill', function (d) {
            return s.colorScale(d[sampleFinalContribKey]);
        });
};

SamplesChart.prototype.clearMean = function () {
    d3.select('.mean').remove();
    d3.select('.meanText').remove();
}

SamplesChart.prototype.setupMean = function () {
    var s = this;
    var mean = d3.mean(s.samples, function (d) {
        return +d[sampleFinalContribKey];
    });
    var meanBar = s.chartSVG.selectAll('.mean')
        .data([mean]);
    meanBar.exit().remove();
    var meanBarWidth = (s.svgWidth - s.axisWidth);
    var meanBarEnter = meanBar.enter()
        .append('rect')
        .classed('mean', true);
    meanBar = meanBar.merge(meanBarEnter);
    meanBar
        .attr("x", function () {
            return s.axisWidth;
        })
        .attr("width", meanBarWidth - 2)
        .attr("height", function () {
            return 1;
        })
        .transition()
        .attr("y", function (d) {
            return s.yScale(d) + 10;
        })
        .attr('fill', 'rgba(0, 0, 0, 0.8)');
    var format = d3.format(".02f");
    var meanText = s.chartSVG.selectAll('.meanText')
        .data([mean]);
    meanText.exit().remove();
    var meanTextEnter = meanText.enter()
        .append('text')
        .classed('meanText', true);
    meanText = meanText.merge(meanTextEnter);
    meanText
        .attr("x", function () {
            return s.axisWidth + 5;
        })
        .transition()
        .attr("y", function (d) {
            return s.yScale(d) + 10;
        })
        .text(function (d) {
            return 'Samples Mean: ' + format(d);
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "1em")
        .attr("font-weight", "bold")
        .attr("alignment-baseline", function (d) {
            if (Math.round(d / s.maxFinContrib) == 1) {
                return 'before-edge';
            }
            return 'after-edge';
        })
        .attr('fill', 'rgba(0, 0, 0, 0.8)');
};

SamplesChart.prototype.pixelInfo = function () {
    var s = this;

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
        else
            return 'white';
    }

    $('#pixelX').text('X: ' + s.pixel.x);
    $('#pixelY').text('Y: ' + s.pixel.y);
    var pixelColor = "#" + hex(s.pixel.colorR) + hex(s.pixel.colorG) + hex(s.pixel.colorB);
    var pixelColSelector = $('#pixelCol');
    pixelColSelector.css("background", pixelColor);
    pixelColSelector.css("color", color(hexToRgb(pixelColor)));
    pixelColSelector.text(pixelColor.toUpperCase());
    var pixelRedSelector = $('#pixelRed');
    pixelRedSelector.css("background", "rgba(" + s.pixel.colorR + ", 0, 0, 1)");
    pixelRedSelector.text('R:' + s.pixel.colorR);
    pixelRedSelector.css("color", color(s.pixel.colorR));
    var pixelGreenSelector = $('#pixelGreen');
    pixelGreenSelector.css("background", "rgba(0," + s.pixel.colorG + ", 0, 1)");
    pixelGreenSelector.text('G:' + s.pixel.colorG);
    pixelGreenSelector.css("color", color(s.pixel.colorG));
    var pixelBlueSelector = $('#pixelBlue');
    pixelBlueSelector.css("background", "rgba(0, 0," + s.pixel.colorB + ", 1)");
    pixelBlueSelector.text('B:' + s.pixel.colorB);
    pixelBlueSelector.css("color", color(s.pixel.colorB));
};

SamplesChart.prototype.modifyData = function (param, index) {
    // sr: sort reset
    // sa: sort ascending
    // sd: sort descending
    // r: remove element
    var s = this;
    switch (param) {
        case 'sr':
            s.modified = false;
            s.samples = s.samplesOrig.slice(0);
            break;
        case 'sa':
            s.modified = true;
            s.samples = s.samples.sort(function (a, b) {
                return d3.ascending(a[sampleFinalContribKey], b[sampleFinalContribKey]);
            });
            break;
        case 'sd':
            s.modified = true;
            s.samples = s.samples.sort(function (a, b) {
                return d3.descending(a[sampleFinalContribKey], b[sampleFinalContribKey]);
            });
            break;
        case 'r':
            s.modified = true;
            s.samples.splice(index, 1);
            break;
    }
    s.update();
};

SamplesChart.prototype.recordRemovedSample = function (d) {
    var s = this;
    var pixel = s.pixel.x + '-' + s.pixel.y;
    if (!userModifications.removedSamples[pixel]) {
        userModifications.removedSamples[pixel] = {};
    }
    userModifications.removedSamples[pixel][d[sampleUIDKey]] = d;
    updateServerReconstructionRequest();
};

SamplesChart.prototype.resetRemovedSample = function () {
    var s = this;
    var pixel = s.pixel.x + '-' + s.pixel.y;
    if (userModifications.removedSamples[pixel]) {
        delete userModifications.removedSamples[pixel];
    }
    updateServerReconstructionRequest();
};

SamplesChart.prototype.updatePathsChart = function (sample) {
    var s = this;
    s.pathsChart.getData(sample);
};