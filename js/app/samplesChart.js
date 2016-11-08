/**
 * Constructor for the SamplesChart
 *
 * @param _shiftChart
 */
function SamplesChart(_shiftChart) {
    var self = this;
    self.shiftChart = _shiftChart;
    self.init();
}
/**
 * Initializes the svg elements required for this chart
 */
SamplesChart.prototype.init = function () {
    // var self = this;
    // self.margin = {top: 30, right: 20, bottom: 30, left: 50};
    //
    // //Gets access to the div element created for this chart from HTML
    // var divelectoralVotes = d3.select("#electoral-vote").classed("content", true);
    // self.svgBounds = divelectoralVotes.node().getBoundingClientRect();
    // self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    // self.svgHeight = 110;
    // //creates svg element within the div
    // self.svg = divelectoralVotes.append("svg")
    //     .attr("width", self.svgWidth)
    //     .attr("height", self.svgHeight)

};

/**
 * Returns the class that needs to be assigned to an element.
 *
 * @param party an ID for the party that is being referred to.
 */
SamplesChart.prototype.chooseClass = function (party) {

    if (party == "R") {
        return "republican";
    }
    else if (party == "D") {
        return "democrat";
    }
    else if (party == "I") {
        return "independent";
    }
};

/**
 * Creates the stacked bar chart, text content and tool tips for electoral vote chart
 *
 * @param electionResult election data for the year selected
 * @param colorScale global quantile scale based on the winning margin between republicans and democrats
 */

SamplesChart.prototype.update = function (electionResult, colorScale) {
    var self = this;

    /** Object */
        // console.log(electionResult);

    var totalEV = 0;
    var indEV = 0;
    var demEV = 0;
    var repEV = 0;

    var ind = [];
    var rep = [];
    var dem = [];

    electionResult.forEach(function (d) {
        totalEV += parseInt(d.Total_EV);
        if (d.RD_Difference == 0) {
            ind.push(d);
            indEV += parseFloat(d.Total_EV)
        }
        else if (d.RD_Difference > 0) {
            rep.push(d);
            repEV += parseFloat(d.Total_EV)
        }
        else {
            dem.push(d);
            demEV += parseFloat(d.Total_EV)
        }
    });

    var midEV = Math.round(totalEV / 20) * 10;

    indEV = Math.round(indEV);
    demEV = Math.round(demEV);
    repEV = Math.round(repEV);

    ind.sort(function (a, b) {
        return a.RD_Difference - b.RD_Difference;
    });

    dem.sort(function (a, b) {
        return Math.abs(b.RD_Difference) - Math.abs(a.RD_Difference);
    });

    rep.sort(function (a, b) {
        return a.RD_Difference - b.RD_Difference;
    });

    var final = ind.concat(dem);
    final = final.concat(rep);

    var xScale = d3.scaleLinear()
        .domain([0, totalEV])
        .range([0, self.svgWidth]);

    var barsGroup = self.svg.selectAll(".bars-group")
        .data([1]);

    barsGroup.exit().remove();

    var barsGroupEnter = barsGroup.enter()
        .append("g")
        .classed("bars-group", true);

    barsGroup = barsGroup.merge(barsGroupEnter);

    var bars = barsGroup.selectAll("rect")
        .data(final);

    bars.exit().remove();

    var barsEnter = bars.enter()
        .append("rect");

    bars = bars.merge(barsEnter);

    var lastStart = 0;

    bars.attr("y", 50)
        .attr("height", 20)
        .attr("width", function (d) {
            var currentWidth = xScale(d.Total_EV);
            d3.select(this).attr("x", function () {
                return lastStart;
            });
            lastStart += currentWidth;
            return currentWidth;
        })
        .classed("electoralVotes", true)
        .attr("fill", function (d) {
            if (d.RD_Difference == 0) {
                return "#009d3e";
            }
            return colorScale(d.RD_Difference);
        });

    var textData = [indEV, demEV, repEV];
    var text = self.svg.selectAll(".electoralVoteText")
        .data(textData);

    text.exit().remove();

    var textEnter = text.enter()
        .append("text");

    text = text.merge(textEnter);

    text.text(function (d) {
        return d;
    })
        .attr("opacity", function (d) {
            if (d == 0)
                return 0;
            else
                return 1;
        })
        .attr("y", 40)
        .attr("x", function (d, i) {
            if (i == 0)
                return 0;
            else if (i == 1)
                return xScale(indEV);
            else
                return self.svgWidth;
        })
        .attr("class", function (d, i) {
            if (i == 0)
                return self.chooseClass("I");
            else if (i == 1)
                return self.chooseClass("D");
            else
                return self.chooseClass("R");
        })
        .classed("electoralVoteText", true);

    var line = self.svg.selectAll(".ev-line")
        .data([1]);

    line.exit().remove();

    var lineEnter = line.enter()
        .append("path");

    line = line.merge(lineEnter);
    line.attr("class", "ev-line ")
        .attr("d", function () {
            return "M  " + self.svgWidth / 2 + " 40 L " + self.svgWidth / 2 + " 80";
        })
        .attr("x", 0)
        .attr("y", 0);

    var infoText = self.svg.selectAll(".ev-text")
        .data([1]);

    infoText.exit().remove();

    var infoTextEnter = infoText.enter()
        .append("text");

    infoText = infoText.merge(infoTextEnter);

    infoText.text("Electoral Vote (" + midEV + " needed to win)")
        .attr("y", 30)
        .attr("x", self.svgWidth / 2)
        .attr("class", "ev-text")
        .attr('transform', function () {
            var bounds = d3.select(this).node().getBoundingClientRect();
            var width = bounds.width;

            return "translate(" + (width / -2) + ", 0)";
        });

    var brush = d3.brushX()
        .extent([[0, 0], [self.svgWidth, 30]])
        .on("start brush end", brushmoved);

    var brushGroup = self.svg.selectAll(".brush")
        .data([1]);

    brushGroup.exit().remove();

    var brushGroupEnter = brushGroup.enter()
        .append("g")
        .classed("brush", true)
        .attr("transform", "translate(0,45)")
        .call(brush);

    brushGroup = brushGroup.merge(brushGroupEnter);

    var brushSelection = [];

    function brushmoved() {
        var s = null;
        try {
            s = d3.event.selection;
        } catch (error) {
        }
        if (s != null){
            self.selection = s;
        }
        if (self.selection == null) {
            brushSelection = [];
        } else {
            brushSelection = [];
            bars.classed("", function(d) {
                var x1 = this.x.baseVal.value;
                var x2 = x1 + this.width.baseVal.value;
                if (self.selection[0] <= x1 && x2 <= self.selection[1]){
                    brushSelection.push(d.Abbreviation);

                }
            });
        }
        self.shiftChart.update(brushSelection);
    }

    try { brushmoved(); } catch (error){}
};
