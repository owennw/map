(function() {
    var width = 1600,
        height = 900,
        axialTilt = -23.4;

    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);

    var projection = d3.geo.orthographic()
            .translate([width / 2, height / 2])
            .scale(400)
            .clipAngle(90)
            .rotate([0, 0, axialTilt]), // yaw, pitch, roll
        arc = d3.geo.greatArc(),
        graticule = d3.geo.graticule(),
        path = d3.geo.path().projection(projection).pointRadius(1.5),
        tooltip = d3.select('body').append('div').attr('class', 'tooltip');

    placeShadow(svg, projection, 880, 835);
    fillOcean(svg, path);

    d3.json('world_fewer.json', function(error, world) {
        if (error) {
            return console.error(error);
        }

        var countries = topojson.feature(world, world.objects.countries),
            capitals = topojson.feature(world, world.objects.cities),
            displayCountries = svg.selectAll('land').data(countries.features),
            displayCapitals = svg.selectAll('city').data(capitals.features);

        function render(
            svg,
            projection,
            arc,
            path,
            displayCountries,
            displayCapitals,
            graticule,
            tooltip) {

            displayCountries.enter()
                .append('path')
                .attr('d', path)
                .attr('class', function(d) { return 'country ' + d.id; })
                .on('mouseover', function(d) {
                    tooltip.text(d.properties.name)
                        .style('display', 'block')
                        .style('opacity', 1);
                })
                .on('mouseout', function(d) {
                    tooltip
                        .style('display', 'none')
                        .style('opacity', 0);
                })
                .on('mousemove', function(d) {
                    tooltip
                        .style('left', (d3.event.pageX + 9) + 'px')
                        .style('top', (d3.event.pageY - 20) + 'px');
                });

            var capitalGroups = displayCapitals.enter().append('g');
            capitalGroups.append('path')
                .attr('d', path)
                .attr('class', 'city');
            capitalGroups.append('text')
                .attr('class', 'city-label')
                .attr('transform', function(d) {
                    var local = projection(d.geometry.coordinates);
                    var x = local[0];
                    var y = local[1];
                    var offset = x < width / 2 ? -7 : 7;
                    return 'translate(' + (x + offset) + ',' + (y - 4) + ')';
                })
                .attr('text-anchor', function(d) {
                    // Specifies where the city text is in relation to its point
                    // globe left -> text left
                    // globe middle - text middle
                    // globe right -> text right
                    var x = projection(d.geometry.coordinates)[0];
                    return x < width / 2 - 100 ? 'end' :
                        x < width / 2 + 100 ? 'middle' :
                        'start';
                })
                .style('display', function(d) {
                    // Prevents the cities not visible on the globe from appearing
                    var centerPos = projection.invert([width / 2, height / 2]);
                    var d = arc.distance({ source: d.geometry.coordinates, target: centerPos });

                    // 1.57 is ~ half of pi
                    return (d > 1.57) ? 'none' : 'inline';
                })
                .text(function(d) { return d.properties.name; });

            svg.append('path')
                .datum(graticule)
                .attr('class', 'graticule noclicks')
                .attr('d', path);
        };

        render(
            svg,
            projection,
            arc,
            path,
            displayCountries,
            displayCapitals,
            graticule,
            tooltip);
    })

    function placeShadow(svg, projection, cx, cy) {
        var id = 'shadow';

        var shadow = svg.append('defs').append('radialGradient')
            .attr({
                'id': id,
                'cx': '50%',
                'cy': '50%'
            });
        shadow.append('stop')
            .attr({
                'offset': '10%',
                'stop-color': '#aaa',
                'stop-opacity': '0.89'
            });
        shadow.append('stop')
            .attr({
                'offset': '100%',
                'stop-color': '#777',
                'stop-opacity': '0'
            });

        svg.append('ellipse')
            .attr({
                'cx': 880,
                'cy': 835,
                'rx': projection.scale() * .80,
                'ry': projection.scale() * .20,
                'stroke-width': 0
            })
            .style('fill', 'url(#' + id + ')');
    }

    function fillOcean(svg, path) {
        var id = 'ocean';

        var ocean = svg.append('defs').append('radialGradient')
            .attr('id', id)
            .attr('cx', '35%')
            .attr('cy', '20%');
        ocean.append('stop')
            .attr({
                'offset': '5%',
                'stop-color': '#def'
            });
        ocean.append("stop")
            .attr({
                'offset': '100%',
                'stop-color': "#9ac"
            });

        svg.append('path')
            .datum({ type: 'Sphere' })
            .attr('d', path)
            .style('fill', 'url(#' + id + ')');
    }
}());
