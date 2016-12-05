var pathsQuery = 'paths-json/';
var pathUIDKey = "uid";
var pathFinalContribKey = "weight";
var pathRKey = "r";
var pathGKey = "g";
var pathBKey = "b";
var pathThroughputKey = "throuput";
var pathTotalProbabilityKey = "tot_prob";
var pathVerticesKey = "vertices";
var vertexObjNameKey = "obj_name";
var vertexRKey = "r";
var vertexGKey = "g";
var vertexBKey = "b";

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
    self.maxVertexPerLine = 15;
    self.vertexLineDistance = 60;
    self.vertexRadius = 10;
    self.strokeWidth = 3;
    self.vertexPerLine = 10;
    //Gets access to the div element created for this chart from HTML
    self.divOuter = d3.select("#paths-chart-container");
    self.table = d3.select(".paths-table");
    self.tableBody = d3.select(".paths-table-body");
    $('#paths-chart-container').hide();
};

PathsChart.prototype.getData = function (_sample) {
    var self = this;
    if (self.sample == undefined || self.sample[sampleUIDKey] != _sample[sampleUIDKey]) {
        self.sample = _sample;
        self.modified = false;
        var filename = _sample.uid.replace('S', 'P') + '.json';
        // Get the paths data and update the chart
        if (demo) {
            var string;
            Math.random() > 0.5 ? string = "data/paths.json" : string = "data/paths2.json";
            d3.json(string, function (error, _paths) {
                $('#paths-chart-container').fadeIn(350, 'linear', function () {
                    $('html, body').animate({
                        scrollTop: $("#paths-chart-container").offset().top
                    }, 200);
                });
                self.pathsOrig = _paths['paths'];
                // self.pixelInfo();
                self.update();
            });
        }
        else {
            d3.json(server + pathsQuery + filename, function (error, _paths) {
                $('#paths-chart-container').fadeIn(350, 'linear', function () {
                    $('html, body').animate({
                        scrollTop: $("#paths-chart-container").offset().top
                    }, 200);
                });
                self.pathsOrig = _paths['paths'];
                self.update();
            });
        }
    }
};

PathsChart.prototype.update = function () {
    var self = this;
    d3.selectAll('.td-hide-detail').classed('td-hide-detail', false);
    d3.selectAll('.path-tr-vertex').remove();
    d3.selectAll('.d3-tip-vertex').remove();
    if (!self.modified)
        self.paths = self.pathsOrig.slice(0);
    var trMain = self.tableBody.selectAll('.path-tr-main')
        .data(self.paths);
    var trMainEnter = trMain.enter()
        .append('tr')
        .attr('class', 'path-tr-main');
    trMain.exit().remove();
    trMain = trMain.merge(trMainEnter);
    self.tdMain = trMain.selectAll('.path-td-main')
        .data(function (d) {
            return [{
                'vis': 'show-detail',
                'value': d[pathUIDKey]
            }, {
                'vis': pathUIDKey,
                'value': d[pathUIDKey]
            }, {
                'vis': pathFinalContribKey,
                'value': d[pathFinalContribKey]
            }, {
                'vis': pathRKey,
                'value': d[pathRKey]
            }, {
                'vis': pathGKey,
                'value': d[pathGKey]
            }, {
                'vis': pathBKey,
                'value': d[pathBKey]
            }, {
                'vis': 'edge-count',
                'value': d[pathVerticesKey].length
            }];
        });
    var tdMainEnter = self.tdMain.enter()
        .append('td')
        .attr("class", function (d) {
            return 'path-td-main td-' + d.vis;
        });
    self.tdMain.exit().remove();
    self.tdMain = self.tdMain.merge(tdMainEnter);
    self.setupEachMainCell('show-detail');
    self.setupEachMainCell(pathUIDKey);
    self.setupEachMainCell(pathFinalContribKey);
    self.setupEachMainCell(pathRKey);
    self.setupEachMainCell(pathGKey);
    self.setupEachMainCell(pathBKey);
    self.setupEachMainCell('edge-count');
};

PathsChart.prototype.setupEachMainCell = function (key) {
    var self = this;
    var tdData = self.tdMain.filter(function (d) {
        return d.vis == key;
    });
    var td = d3.selectAll('.td-' + key)
        .data(tdData.data());
    var tdEnter = td.enter();
    td.exit().remove();
    td = td.merge(tdEnter);
    if (key != 'show-detail') {
        td.text(function (d) {
            return d.value;
        });
    }
    else {
        var popOptShow = {
            title: 'Show Path Vertices',
            content: 'Displays objects that the path consists of, in the order of bounces.',
            trigger: 'hover',
            container: 'body'
        };
        var popOptHide = {
            title: 'Hide Path Vertices',
            content: 'Hide the row below which displays path objects.',
            trigger: 'hover',
            container: 'body'
        };
        td.call(setPopover, popOptShow);
        td.on('click', function (d, index) {
            var caller = $(this);
            if (caller.hasClass("td-hide-detail")) {
                d3.select('#' + d.value + '-vertex-info').remove();
                caller.removeClass("td-hide-detail");
                setPopover(caller, popOptShow);
            }
            else {
                caller.addClass("td-hide-detail");
                var parentTR = d3.event.target.parentNode;
                self.setupVertexRow(d.value, index, parentTR);
                setPopover(caller, popOptHide);
            }
        });
    }
};

PathsChart.prototype.setupVertexRow = function (uid, index, parentTR) {
    var self = this;
    var trID = uid + '-vertex-info';
    var svgID = uid + '-svg';
    var eliminateID = uid + '-elim';
    var pathLength = self.paths[index][pathVerticesKey].length;
    var eliminateClass = 'path-tr-eliminate';
    if (userModifications.eliminatedPaths[pathLength]) {
        eliminateClass += ' checked';
    }
    var html =
        '<tr class="path-tr-vertex" id="' + trID + '">' +
        '<td colspan="1" ' +
        'id="' + eliminateID + '" ' +
        'class="' + eliminateClass + '"' +
        '" data-path-index="' + index +
        '" data-path-length="' + pathLength +
        '"></td>' +
        '<td colspan="6"><svg id="' + svgID + '"></svg></td>' +
        '</tr>';
    if ($('#' + trID).length) {
        // Row has already been created.
    }
    else {
        $(html).insertAfter($(parentTR));
        self.setupVertexSVG(index, svgID);
        self.setupEliminateButton(eliminateID, pathLength);
    }
};

PathsChart.prototype.setupEliminateButton = function (eliminateID, _pathLength) {
    var self = this;
    var popOptElim = {
        title: 'Omit Paths of Length ' + _pathLength,
        content: 'Will omit all paths of length ' + _pathLength + ' from the reconstructed render.',
        trigger: 'hover',
        container: 'body'
    };
    var popOptRestore = {
        title: 'Permit Paths of Length ' + _pathLength,
        content: 'Paths of length ' + _pathLength + ' have been omitted from reconstruction. You can permit these paths by clicking on the this button.',
        trigger: 'hover',
        container: 'body'
    };
    if (userModifications.eliminatedPaths[_pathLength])
        setPopover($('#' + eliminateID), popOptRestore);
    else
        setPopover($('#' + eliminateID), popOptElim);
    $('#' + eliminateID).on('click', function (e) {
        var pathLength = $(this).data('pathLength');
        var selector = $('[data-path-length="' + pathLength + '"]');
        if (userModifications.eliminatedPaths[pathLength]) {
            delete userModifications.eliminatedPaths[pathLength];
            setPopover(selector, popOptElim);
            selector.removeClass('checked');
        }
        else {
            userModifications.eliminatedPaths[pathLength] = pathLength;
            setPopover(selector, popOptRestore);
            selector.addClass('checked');
        }
        updateServerReconstructionRequest();
    });
};

PathsChart.prototype.setupVertexSVG = function (index, svgID) {
    var self = this;
    var data = self.paths[index][pathVerticesKey];
    if (data.length > self.maxVertexPerLine) {
        self.vertexPerLine = self.maxVertexPerLine;
    }
    else {
        self.vertexPerLine = data.length;
    }
    self.maxPossibleLines = Math.floor((data.length - 1) / self.vertexPerLine) + 1;
    self.vertexSVG = d3.select('#' + svgID);
    self.vertexSVGParent = self.vertexSVG.node().parentNode;
    var firstTD = d3.select('.td-show-detail').node();
    var firstTDWidth = firstTD.getBoundingClientRect().width;
    var pathTR = d3.select('.path-tr-vertex').node();
    var pathTRWidth = pathTR.getBoundingClientRect().width;
    var padding = parseInt($(self.vertexSVGParent).css('padding'));
    self.svgWidth = pathTRWidth - firstTDWidth - (padding * 2);
    self.svgHeight = self.maxPossibleLines * self.vertexLineDistance;
    self.vertexSVG.attr("width", self.svgWidth);
    self.vertexSVG.attr("height", self.svgHeight);
    self.setupVertexDisplay(index);
};

PathsChart.prototype.setupVertexDisplay = function (index) {
    var self = this;
    var data = self.paths[index][pathVerticesKey];
    var xPosition = d3.scaleLinear()
        .range([self.vertexRadius, self.svgWidth - self.vertexRadius])
        .domain([0, self.vertexPerLine - 1]);
    var yPosition = d3.scaleLinear()
        .range([self.vertexLineDistance / 2, self.svgHeight - self.vertexLineDistance / 2])
        .domain([1, self.maxPossibleLines]);
    for (var i = 1; i <= self.maxPossibleLines; i++) {
        self.vertexSVG.append('rect')
            .attr("x", xPosition(0))
            .attr("y", yPosition(i) - (self.strokeWidth / 2))
            .attr("width", function () {
                if (i == self.maxPossibleLines) {
                    return xPosition((data.length - 1) % self.vertexPerLine) - self.vertexRadius;
                }
                else {
                    return self.svgWidth - self.vertexRadius * 2;
                }
            })
            .attr("height", self.strokeWidth);
    }
    var vertices = self.vertexSVG.selectAll("circle")
        .data(data);
    vertices.exit().remove();
    var verticesEnter = vertices.enter()
        .append("circle")
        .classed("vertex-circle", true);
    vertices = vertices.merge(verticesEnter);
    var tip = d3.tip().attr('class', 'd3-tip d3-tip-vertex').html(function (d) {
        return '<strong>ID: </strong>' + d[vertexObjNameKey] + '<br>' +
            '<strong>R: </strong>' + d[vertexRKey] + '<br>' +
            '<strong>G: </strong>' + d[vertexGKey] + '<br>' +
            '<strong>B: </strong>' + d[vertexBKey];
    });
    tip.offset([-7, 0]);
    vertices.call(tip);
    vertices
        .attr('cx', function (d, i) {
            return xPosition(i % self.vertexPerLine);
        })
        .attr('cy', function (d, i) {
            var lineIdentifier = Math.floor(i / self.vertexPerLine) + 1;
            return yPosition(lineIdentifier);
        })
        .attr('r', function (d) {
            return self.vertexRadius - self.strokeWidth;
        })
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .attr('stroke-width', self.strokeWidth)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
};