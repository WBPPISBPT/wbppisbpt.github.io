var pathUIDKey = "uid";
var pathFinalContribKey = "fin_contrib";
var pathThroughputKey = "throuput";
var pathTotalProbabilityKey = "tot_prob";
var pathVerticesKey = "vertices";
var vertexObjNameKey = "obj_name";
var vertexMatNameKey = "mat_name";
var vertexMatTypeKey = "mat_type";
var vertexProbKey = "prob";

/**
 * Constructor for the SamplesChart
 *
 * @param _shiftChart
 */
function PathsChart() {
    var self = this;
    self.init();
}
/**
 * Initializes the svg elements required for this chart
 */
PathsChart.prototype.init = function () {
    var self = this;
    self.sample;
    self.pathsOrig;
    self.paths;
    self.modified = false;


    //Gets access to the div element created for this chart from HTML
    self.divOuter = d3.select("#paths-chart-container");
    self.table = d3.select(".paths-table");
    self.tableBody = d3.select(".paths-table-body");

    $('#paths-chart-container').hide();
};


PathsChart.prototype.getData = function (_sample) {
    var self = this;
    if (self.sample == undefined || self.sample[sampleUIDKey] != _sample[sampleUIDKey] ) {

        self.sample = _sample;
        self.modified = false;

        console.log('PathsChart.getData called.');
        console.log('SampleUID: ', _sample[sampleUIDKey]);
        // Get the paths data and update the chart
        if (demo) {
            var string;
            Math.random() > 0.5 ? string = "data/paths.json" : string = "data/paths2.json";
            d3.json(string, function (error, _paths) {
                $('#paths-chart-container').show();
                console.log('PathsChart.getData received data: ', _paths);
                self.pathsOrig = _paths['paths'];
                // self.pixelInfo();
                self.update();
            });
        }
        else {

            $('#paths-chart-container').show();
            $('.wait2').show();

            let query = {
                "sampleID": _sample[sampleUIDKey]
            };

            let send_data = {
                "query_string": JSON.stringify(query)
            };

            $.ajax({
                type: "GET"
                    ,
                url: database_URI + '/getFromCollection/SamplePaths'
                    ,
                success: function (data, textStatus, jqXHR) {
                    console.log(textStatus)
                    console.log("Got sample paths for ID", _sample[sampleUIDKey]);
                    console.log(data);

                    
                    self.pathsOrig = data;
                    $('.wait2').hide();
                    self.update();
                    
                    /*
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

                    console.log("Samples results")
                    console.log(results)

                    */
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

PathsChart.prototype.update = function () {
    var self = this;

    if (!self.modified)
        self.paths = self.pathsOrig.slice(0);

    var trMain = self.tableBody.selectAll('.path-tr-main')
        .data(self.paths);

    var trMainEnter = trMain.enter()
        .append('tr')
        .attr('class', 'path-tr-main');

    trMain.exit().remove();
    trMain = trMain.merge(trMainEnter);





   // return;


    var tdMain = trMain.selectAll('.path-td-main')
        .data(function (d) {
            return [
                {'vis': 'show-detail', 'value': d[pathUIDKey]},
                {'vis': 'uid', 'value': d[pathUIDKey]},
                {'vis': 'fin-contrib', 'value': d[pathFinalContribKey]},
                //{'vis': 'throughput', 'value': d[pathThroughputKey]},
                {'vis': 'tot-prob', 'value': d[pathTotalProbabilityKey]},
                {'vis': 'edge-count', 'value': d[pathVerticesKey].length},
                {'vis': 'tp-d-tp', 'value': d[pathThroughputKey] / d[pathTotalProbabilityKey]},
                {'vis': 'vertices', 'value': d[pathVerticesKey]}
            ];
        });

    var tdMainEnter = tdMain.enter()
        .append('td')
        .attr("class", function (d) {
            return 'path-td-main td-' + d.vis;
        });

    tdMain.exit().remove();
    tdMain = tdMain.merge(tdMainEnter);

    var finContribData = tdMain.filter(function (d) {
        return d.vis == 'fin-contrib';
    });

    var temp = d3.selectAll('.td-fin-contrib');
    var finContrib = d3.selectAll('.td-fin-contrib')
        .data(finContribData.data());

    var finContribEnter = finContrib.enter();
        // .append('p');

    finContrib.exit().remove();
    finContrib = finContrib.merge(finContribEnter);

    finContrib.text(function (d) {
            return d.value;
        });

};


PathsChart.prototype.setupAxis = function (param) {
    var self = this;

    var className;
    var axisFunction;
    param == 'y' ? className = 'y-axis' : className = 'x-axis';

    var xAxisScale = d3.scaleLinear()
        .range([0, self.svgWidth - self.axisWidth - 3]);

    if (param == 'y') {
        axisFunction = d3.axisLeft();
        axisFunction.scale(self.yScale);
    }
    else {
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
            }
            else {
                var translate = "translate(";
                translate += self.axisWidth;
                translate += ", ";
                translate += (self.svgHeight - self.yScale(self.maxFinContrib) - 10);
                translate += ")";
                return translate;
            }
        });
};

PathsChart.prototype.setupBars = function () {
    var self = this;
    var bars = self.chartSVG.selectAll('.bar')
        .data(self.paths);

    bars.exit().remove()
        .attr('fill', function (d) {
            return self.colorScale(d[sampleFinalContribKey]);
        });

    var barsEnter = bars.enter()
        .append('rect')
        .classed('bar', true);

    bars = bars.merge(barsEnter);

    var barWidth = (self.svgWidth - self.axisWidth) / self.paths.length;

    bars
        .attr("x", function (d) {
            return self.xScale(d[sampleUIDKey]);
        })
        .attr("y", function (d) {
            return self.yScale(d[sampleFinalContribKey]) + 10;
        })
        .attr("width", barWidth - 2)
        .attr("height", function (d) {
            return self.svgHeight - self.yScale(d[sampleFinalContribKey]) - 20;
        })
        .attr('style', 'cursor: pointer;')
        .attr('fill', function (d) {
            return self.colorScale(d[sampleFinalContribKey]);
        })
        .on('contextmenu', function (d, i) {
            if (self.paths.length > 1) {
                self.modifyData('r', i);
                self.recordRemovedPixel(d);
            }
            return false;
        });
};
PathsChart.prototype.setupMean = function () {
    var self = this;

    var mean = d3.mean(self.paths, function (d) {
        return +d[sampleFinalContribKey];
    });


    d3.select('.mean').remove();
    d3.select('.meanText').remove();
    console.log(mean);

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

PathsChart.prototype.recordRemovedPixel = function (d) {
    var self = this;
    var pixel = self.sample.x + '-' + self.sample.y;
    if (!removedSamples[pixel]) {
        removedSamples[pixel] = {};
    }
    removedSamples[pixel][d[sampleUIDKey]] = d;
};

PathsChart.prototype.pixelInfo = function () {
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
        else
            return 'white';
    }

    $('#pixelX').text('X: ' + self.sample.x);
    $('#pixelY').text('Y: ' + self.sample.y);

    var pixelColor = "#" + hex(self.sample.colorR) + hex(self.sample.colorG) + hex(self.sample.colorB);

    $('#pixelCol').css("background", pixelColor);
    $('#pixelCol').css("color", color(hexToRgb(pixelColor)));
    $('#pixelCol').text(pixelColor.toUpperCase());

    $('#pixelRed').css("background", "rgba(" + self.sample.colorR + ", 0, 0, 1)");
    $('#pixelRed').text('R:' + self.sample.colorR);
    $('#pixelRed').css("color", color(self.sample.colorR));

    $('#pixelGreen').css("background", "rgba(0," + self.sample.colorG + ", 0, 1)");
    $('#pixelGreen').text('G:' + self.sample.colorG);
    $('#pixelGreen').css("color", color(self.sample.colorG));

    $('#pixelBlue').css("background", "rgba(0, 0," + self.sample.colorB + ", 1)");
    $('#pixelBlue').text('B:' + self.sample.colorB);
    $('#pixelBlue').css("color", color(self.sample.colorB));
};

PathsChart.prototype.modifyData = function (param, index) {
    // sr: sort reset
    // sa: sort ascending
    // sd: sort descending
    // r: remove element
    var self = this;
    switch (param) {
        case 'sr':
            self.modified = false;
            self.paths = self.pathsOrig.slice(0);
            break;
        case 'sa':
            self.modified = true;
            self.paths = self.paths.sort(function (a, b) {
                return d3.ascending(a[sampleFinalContribKey], b[sampleFinalContribKey]);
            });
            break;
        case 'sd':
            self.modified = true;
            self.paths = self.paths.sort(function (a, b) {
                return d3.descending(a[sampleFinalContribKey], b[sampleFinalContribKey]);
            });
            break;
        case 'r':
            self.modified = true;
            self.paths.splice(index, 1);
            break;
    }
    self.update();
};
