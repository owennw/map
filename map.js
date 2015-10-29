var map = function() {

    var projection = null,
        graticule = null,
        pointRadius = 0;

    var width = 1600,
        height = 900,
        svg = d3.select('body').append('svg')
            .attr('width', width)
            .attr('height', height);

    var map = function(world) {

        projection.translate([width / 2, height / 2]);
        var path = d3.geo.path().projection(projection).pointRadius(pointRadius),
        tooltip = d3.select('body').append('div').attr('class', 'tooltip');

        placeShadow(svg, projection, 880, 835);
        fillOcean(svg, path);

        var countries = topojson.feature(world, world.objects.countries_110),
            capitals = topojson.feature(world, world.objects.cities),
            displayCountries = svg.selectAll('land').data(countries.features),
            displayCapitals = svg.selectAll('city').data(capitals.features);

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
        positionLabels(svg, projection);
        if (graticule) {
            svg.append('path')
                .datum(graticule)
                .attr('class', 'graticule')
                .attr('d', path);
        }

        function positionLabels(svg, projection) {
            svg.selectAll('.city-label')
                .attr('transform', function(d) {
                    var coords = projection(d.geometry.coordinates);
                    return 'translate(' + coords[0] + ',' + coords[1] + ')';
                })
                .attr('text-anchor', function(d) {
                    // Specifies where the city text is in relation to its point
                    // map left -> text left
                    // map middle - text middle
                    // map right -> text right
                    var x = projection(d.geometry.coordinates)[0];
                    return x < width / 2 - 100 ? 'end' :
                        x < width / 2 + 100 ? 'middle' :
                        'start';
                })
                .style('display', function(d) {
                    // Prevents the cities not visible on the globe from appearing
                    var centerPos = projection.invert([width / 2, height / 2]);
                    var arc = d3.geo.greatArc();
                    var d = arc.distance({ source: d.geometry.coordinates, target: centerPos });

                    // 1.57 is ~ half of pi
                    return (d > 1.57) ? 'none' : 'inline';
                })
                .text(function(d) { return d.properties.name; });
        }

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

        function refresh(svg, projection, path) {

            svg.selectAll('.country').attr('d', path);
            svg.selectAll('.city').attr('d', path);
            svg.selectAll('.graticule').attr('d', path);
            positionLabels(svg, projection);
        }

        setInterval(function() {
            var rotation = projection.rotate();
            rotation = [rotation[0] + 0.6, rotation[1], rotation[2]];
            projection.rotate(rotation);
            refresh(svg, projection, path);
        }, 400);
    };

    map.projection = function(p) {
        if (!arguments.length) {
            return projection;
        }
        projection = p;
        return map;
    }

    map.graticule = function() {
        graticule = d3.geo.graticule();
        return map;
    }

    map.pointRadius = function(radius) {
        if (!arguments.length) {
            return pointRadius;
        }
        pointRadius = radius;
        return map;
    }

    return map;
};


(function() {
    d3.json('world_110.json', function(error, world) {
        if (error) {
            return console.error(error);
        }

        var axialTilt = -23.4;
        var projection = d3.geo.orthographic()
            .scale(400)
            .clipAngle(90)
            .rotate([0, 0, axialTilt]); // yaw, pitch, roll

        map()
            .projection(projection)
            .pointRadius(1.5)
            .graticule()(world);
    });
}());
