from app.parser import parse_geodata


def test_multi_shipment_hierarchy_and_confidence_states() -> None:
    raw = open("../samples/geodata_multi_shipment_sample", "rb").read()
    shipments, warnings = parse_geodata(raw)

    assert not warnings
    assert [shipment.consignment_reference for shipment in shipments] == [
        "90000000000003",
        "90000000000004",
    ]
    assert len(shipments[0].lines) == 2
    assert shipments[0].lines[0].status == "pending_review"
    assert shipments[1].lines[0].category == "homeware"


def test_overflow_line_is_reported_and_skipped() -> None:
    raw = b"#ENCODING;UTF-8;\n#DEF;GEODATA:SHIPMENT;MPSID;;\nSHIPMENT;REF;EXTRA;\n"

    shipments, warnings = parse_geodata(raw)

    assert not shipments
    assert len(warnings) == 1
    assert "has 2 fields" in warnings[0]


def test_definitions_are_used_when_columns_are_reordered() -> None:
    raw = (
        b"#ENCODING;UTF-8;\n"
        b"#DEF;GEODATA:SHIPMENT;MPSID;NUMORDER;;\n"
        b"#DEF;GEODATA:INTERINVOICELINE;RCTARIF;CCONTENT;CORIGIN;NUMORDER;;\n"
        b"SHIPMENT;REF;1;\n"
        b"INTERINVOICELINE;9003110000;PLASTIC FRAMES;CN;2;\n"
    )

    shipments, warnings = parse_geodata(raw)

    assert not warnings
    line = shipments[0].lines[0]
    assert line.description == "PLASTIC FRAMES"
    assert line.commodity_code == "9003110000"