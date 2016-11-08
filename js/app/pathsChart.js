/**
 * Constructor for the Vote Percentage Chart
 */
function PathsChart() {

    var self = this;
    self.init();
}
/**
 * Initializes the svg elements required for this chart
 */
PathsChart.prototype.init = function () {
    // var self = this;
    // self.margin = {top: 30, right: 20, bottom: 30, left: 50};
    // self.divvotesPercentage = d3.select("#votes-percentage").classed("content", true);
    //
    // //Gets access to the div element created for this chart from HTML
    // self.svgBounds = self.divvotesPercentage.node().getBoundingClientRect();
    // self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    // self.svgHeight = 180;
    //
    // //creates svg element within the div
    // self.svg = self.divvotesPercentage.append("svg")
    //     .attr("width", self.svgWidth)
    //     .attr("height", self.svgHeight)
};

PathsChart.prototype.updateWidth = function (width) {
    var self = this;
    self.svgWidth = width - self.margin.left - self.margin.right;
    d3.select("#votes-percentage")
        .select("svg")
        .attr("width", self.svgWidth);
};

/**
 * Returns the class that needs to be assigned to an element.
 *
 * @param party an ID for the party that is being referred to.
 */
PathsChart.prototype.chooseClass = function (party) {

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
 * Renders the HTML content for tool tip
 *
 * @param tooltip_data information that needs to be populate in the tool tip
 * @return text HTML content for toop tip
 */
PathsChart.prototype.tooltip_render = function (tooltip_data) {
    var self = this;
    var text = "<ul>";
    tooltip_data.result.forEach(function (row) {
        if (row.nominee != " ")
            text += "<li class = " + self.chooseClass(row.party) + ">" + row.nominee + ":\t\t" + row.votecount + "(" + row.percentage + "%)" + "</li>"
    });

    return text;
};

/**
 * Creates the stacked bar chart, text content and tool tips for Vote Percentage chart
 *
 * @param electionResult election data for the year selected
 */
PathsChart.prototype.update = function (electionResult) {
    var self = this;

    var tooltip_data = {
        "result": [
            {
                "nominee": electionResult[0].D_Nominee_prop,
                "votecount": electionResult[0].D_Votes_Total,
                "percentage": electionResult[0].D_PopularPercentage,
                "party": "D"
            },
            {
                "nominee": electionResult[0].R_Nominee_prop,
                "votecount": electionResult[0].R_Votes_Total,
                "percentage": electionResult[0].R_PopularPercentage,
                "party": "R"
            },
            {
                "nominee": electionResult[0].I_Nominee_prop,
                "votecount": electionResult[0].I_Votes_Total,
                "percentage": electionResult[0].I_PopularPercentage,
                "party": "I"
            }
        ]
    };

    var tip = d3.tip().attr('class', 'd3-tip-pop')
        .direction('s')
        .offset(function () {
            return [0, 0];
        })
        .html(function () {
            return self.tooltip_render(tooltip_data);
        });

    self.svg.call(tip);

    var final = [
        parseFloat(electionResult[0].I_PopularPercentage) || 0,
        parseFloat(electionResult[0].D_PopularPercentage) || 0,
        parseFloat(electionResult[0].R_PopularPercentage) || 0
    ];

    var total = final[0] + final[1] + final[2];

    var xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, self.svgWidth]);

    var bars = self.svg.selectAll("rect")
        .data(final);

    bars.exit().remove();

    var barsEnter = bars.enter()
        .append("rect");

    bars = bars.merge(barsEnter);

    var lastStart = 0;

    bars.attr("y", 70)
        .attr("height", 20)
        .attr("width", function (d) {
            var currentWidth = xScale(d * 100 / total);
            d3.select(this).attr("x", function () {
                return lastStart;
            });
            lastStart += currentWidth + 1;
            return currentWidth;
        })
        .classed("electoralVotes", true)
        .attr("class", function (d, i) {
            if (i == 0)
                return self.chooseClass("I");
            else if (i == 1)
                return self.chooseClass("D");
            else
                return self.chooseClass("R");
        })
        .on('mouseover', function () {
            tip.show();
            var coordinates = [d3.event.x, d3.event.y];
            d3.selectAll(".d3-tip-pop")
                .style("left", (coordinates[0] + 20) + "px");
        })
        .on('mousemove', function () {
            var coordinates = [d3.event.x, d3.event.y];
            d3.selectAll(".d3-tip-pop")
                .style("left", (coordinates[0] + 20) + "px");
        })
        .on('mouseout', tip.hide);

    var text = self.svg.selectAll(".votesPercentageText")
        .data(final);

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
        .attr("y", 60)
        .attr("x", function (d, i) {
            if (i == 0)
                return 0;
            else if (i == 1)
                return xScale(final[0] * 100 / total);
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
        .classed("votesPercentageText", true);

    var nominees = [electionResult[0].I_Nominee_prop, electionResult[0].D_Nominee_prop, electionResult[0].R_Nominee_prop];

    var nominee = self.svg.selectAll(".votesPercentageNominee")
        .data(nominees);

    nominee.exit().remove();

    var nomineeEnter = nominee.enter()
        .append("text");

    nominee = nominee.merge(nomineeEnter);

    nominee.text(function (d) {
        return d;
    })
        .attr("opacity", function (d) {
            if (d == 0)
                return 0;
            else
                return 1;
        })
        .attr("y", 25)
        .attr("x", function (d, i) {
            if (i == 0)
                return 0;
            else if (i == 1) {
                if (nominees[0] == 0) {
                    d3.select(this).style("text-anchor", "start");
                    return 0;
                }
                else {
                    d3.select(this).style("text-anchor", "middle");
                    return xScale(50);
                }
            }
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
        .classed("votesPercentageNominee", true);

    var line = self.svg.selectAll(".ev-line")
        .data([1]);

    line.exit().remove();

    var lineEnter = line.enter()
        .append("path");

    line = line.merge(lineEnter);
    line.attr("class", "ev-line ")
        .attr("d", function () {
            return "M  " + self.svgWidth / 2 + " 60 L " + self.svgWidth / 2 + " 100";
        })
        .attr("x", 0)
        .attr("y", 0);

    var infoText = self.svg.selectAll(".ev-text")
        .data([1]);

    infoText.exit().remove();

    var infoTextEnter = infoText.enter()
        .append("text");

    infoText = infoText.merge(infoTextEnter);

    infoText.text("Popular Vote in Percentage [50%]")
        .attr("y", 50)
        .attr("x", self.svgWidth / 2)
        .attr("class", "ev-text")
        .attr('transform', function () {
            var bounds = d3.select(this).node().getBoundingClientRect();
            var width = bounds.width;

            return "translate(" + (width / -2) + ", 0)";
        });

    // ******* TODO: PART III *******

    //Create the stacked bar chart.
    //Use the global color scale to color code the rectangles.
    //HINT: Use .votesPercentage class to style your bars.

    //Display the total percentage of votes won by each party
    //on top of the corresponding groups of bars.
    //HINT: Use the .votesPercentageText class to style your text elements;  Use this in combination with
    // chooseClass to get a color based on the party wherever necessary

    //Display a bar with minimal width in the center of the bar chart to indicate the 50% mark
    //HINT: Use .middlePoint class to style this bar.

    //Just above this, display the text mentioning details about this mark on top of this bar
    //HINT: Use .votesPercentageNote class to style this text element

    //Call the tool tip on hover over the bars to display stateName, count of electoral votes.
    //then, vote percentage and number of votes won by each party.

    //HINT: Use the chooseClass method to style your elements based on party wherever necessary.

};
