<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:mei="http://www.music-encoding.org/ns/mei" xmlns:my="http://tempuri.org/dummy" exclude-result-prefixes="xs mei" version="1.0">
    <xsl:output method="xml" indent="yes" encoding="UTF-8" omit-xml-declaration="no" standalone="no" />

    <xsl:strip-space elements="*" />

    <!-- This is very dumb. Find a good way to generate it -->
    <my:tuning>
        <course n="1" pname="f">
            <fret n="0" pname="f" oct="4" />
            <fret n="1" pname="f" accid="s" oct="4" />
            <fret n="2" pname="g" oct="4" />
            <fret n="3" pname="g" accid="s" oct="4" />
            <fret n="4" pname="a" oct="4" />
            <fret n="5" pname="b" accid="f" oct="4" />
            <fret n="6" pname="b" oct="4" />
            <fret n="7" pname="c" oct="5" />
        </course>
        <course n="2" pname="d">
            <fret n="0" pname="d" oct="4" />
            <fret n="1" pname="e" accid="f" oct="4" />
            <fret n="2" pname="e" oct="4" />
            <fret n="3" pname="f" oct="4" />
            <fret n="4" pname="f" accid="s" oct="4" />
            <fret n="5" pname="g" oct="4" />
            <fret n="6" pname="g" accid="s" oct="4" />
            <fret n="7" pname="a" oct="4" />
        </course>
        <course n="3" pname="a">
            <fret n="0" pname="a" oct="3" />
            <fret n="1" pname="b" accid="f" oct="3" />
            <fret n="2" pname="b" oct="3" />
            <fret n="3" pname="c" oct="4" />
            <fret n="4" pname="c" accid="s" oct="4" />
            <fret n="5" pname="d" oct="4" />
        </course>
        <course n="4" pname="f">
            <fret n="0" pname="f" oct="3" />
            <fret n="1" pname="f" accid="s" oct="3" />
            <fret n="2" pname="g" oct="3" />
            <fret n="3" pname="g" accid="s" oct="3" />
            <fret n="4" pname="a" oct="3" />
            <fret n="5" pname="b" accid="f" oct="3" />
            <fret n="6" pname="b" oct="3" />
            <fret n="7" pname="c" oct="4" />
        </course>
        <course n="5" pname="d">
            <fret n="0" pname="d" oct="3" />
            <fret n="1" pname="e" accid="f" oct="3" />
            <fret n="2" pname="e" oct="3" />
            <fret n="3" pname="f" oct="3" />
            <fret n="4" pname="f" accid="s" oct="3" />
            <fret n="5" pname="g" oct="3" />
            <fret n="6" pname="g" accid="s" oct="3" />
            <fret n="7" pname="a" oct="3" />
        </course>
        <course n="6" pname="a">
            <fret n="0" pname="a" oct="2" />
            <fret n="1" pname="b" accid="f" oct="2" />
        </course>
        <course n="7" pname="g">
            <fret n="0" pname="g" oct="2" />
        </course>
        <course n="8" pname="f">
            <fret n="0" pname="f" oct="2" />
        </course>
        <course n="9" pname="e">
            <fret n="0" pname="e" oct="2" />
        </course>
        <course n="10" pname="d">
            <fret n="0" pname="d" oct="2" />
        </course>
        <course n="11" pname="c">
            <fret n="0" pname="c" oct="2" />
        </course>
    </my:tuning>

    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()" />
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:staffDef">
        <xsl:element name="staffDef" namespace="http://www.music-encoding.org/ns/mei">
            <xsl:attribute name="n">1</xsl:attribute>
            <xsl:attribute name="lines">5</xsl:attribute>
            <xsl:attribute name="clef.line">4</xsl:attribute>
            <xsl:attribute name="clef.shape">F</xsl:attribute>
            <xsl:attribute name="meter.count">1</xsl:attribute>
            <xsl:attribute name="meter.unit">8</xsl:attribute>
        </xsl:element>
    </xsl:template>

    <xsl:template match="mei:staff">
        <xsl:apply-templates select="*" />
    </xsl:template>

    <xsl:template match="mei:layer">
        <xsl:apply-templates select="*" />
    </xsl:template>

    <xsl:template match="mei:tabGrp">
        <xsl:variable name="position" select="position()" />
        <xsl:element name="measure" namespace="http://www.music-encoding.org/ns/mei">
            <xsl:attribute name="n">
                <xsl:value-of select="$position"></xsl:value-of>
            </xsl:attribute>

            <xsl:element name="staff" namespace="http://www.music-encoding.org/ns/mei">
                <xsl:attribute name="n">1</xsl:attribute>

                <xsl:element name="layer" namespace="http://www.music-encoding.org/ns/mei">
                    <xsl:attribute name="n">1</xsl:attribute>

                    <xsl:choose>
                        <xsl:when test="count(./mei:note) = 1">
                            <xsl:apply-templates select="*" />
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:element name="chord" namespace="http://www.music-encoding.org/ns/mei">
                                <xsl:attribute name="dur">8</xsl:attribute>
                                <xsl:attribute name="stem.len">0</xsl:attribute>
                                <xsl:apply-templates select="*" />
                            </xsl:element>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:element>
            </xsl:element>
        </xsl:element>
    </xsl:template>


    <xsl:template match="mei:note">
        <xsl:variable name="course" select="@tab.course" />
        <xsl:variable name="fret" select="@tab.fret" />
        <xsl:variable name="correspNote" select="document('')/*/my:tuning/course[@n=$course]/fret[@n=$fret]" />

        <!--
            read @course, check in tuning which note it is
            then read @fret and transpose accordingly -->
        <xsl:element name="note" namespace="http://www.music-encoding.org/ns/mei">
            <xsl:attribute name="xml:id">
                <xsl:value-of select="@xml:id" />
            </xsl:attribute>

            <xsl:attribute name="test">
                <xsl:value-of select="$correspNote" />
            </xsl:attribute>

            <xsl:if test="$correspNote/@pname">
                <xsl:attribute name="pname">
                    <xsl:value-of select="$correspNote/@pname" />
                </xsl:attribute>
            </xsl:if>

            <xsl:if test="$correspNote/@oct">
                <xsl:attribute name="oct">
                    <xsl:value-of select="$correspNote/@oct" />
                </xsl:attribute>
            </xsl:if>

            <xsl:if test="$correspNote/@accid">
                <xsl:attribute name="accid">
                    <xsl:value-of select="$correspNote/@accid" />
                </xsl:attribute>
            </xsl:if>

            <xsl:if test="count(./parent::*/mei:note) = 1">
                <xsl:attribute name="dur">8</xsl:attribute>
                <xsl:attribute name="stem.len">0</xsl:attribute>
            </xsl:if>

            <xsl:apply-templates select="*" />
        </xsl:element>
    </xsl:template>

    <xsl:template match="mei:lb" />
</xsl:stylesheet>