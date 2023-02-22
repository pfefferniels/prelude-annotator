<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:mei="http://www.music-encoding.org/ns/mei" xmlns:my="http://tempuri.org/dummy" exclude-result-prefixes="xs mei" version="1.0">
    <xsl:output method="xml" indent="yes" encoding="UTF-8" omit-xml-declaration="no" standalone="no" />

    <xsl:strip-space elements="*" />

    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()" />
        </xsl:copy>
    </xsl:template>

    <xsl:template match="mei:staff">
        <xsl:apply-templates select="*" />
    </xsl:template>

    <xsl:template match="mei:layer">
        <xsl:apply-templates select="*" />
    </xsl:template>

    <xsl:template match="mei:tabGrp">
        <xsl:variable name="position" select="position()" />
        <xsl:variable name="id" select="@xml:id" />

        <xsl:element name="measure" namespace="http://www.music-encoding.org/ns/mei">
            <xsl:attribute name="right">invis</xsl:attribute>
            <xsl:attribute name="n">
                <xsl:value-of select="$position"></xsl:value-of>
            </xsl:attribute>

            <xsl:copy-of select="//mei:*[@startid=concat('#', $id)]" />

            <xsl:for-each select="mei:note[@xml:id]">
                <xsl:variable name="noteId" select="concat('#', @xml:id)" />

                <xsl:copy-of select="//mei:*[@startid=$noteId]" />
                <!--<xsl:if test="count(./mei:*[@plist]) lt 1">
                    <xsl:copy-of select="//mei:*[contains(@plist, $noteId)]" />
                </xsl:if>-->
            </xsl:for-each>

            <xsl:element name="staff" namespace="http://www.music-encoding.org/ns/mei">
                <xsl:attribute name="n">1</xsl:attribute>

                <xsl:element name="layer" namespace="http://www.music-encoding.org/ns/mei">
                    <xsl:attribute name="n">1</xsl:attribute>

                    <xsl:element name="tabGrp" namespace="http://www.music-encoding.org/ns/mei">
                        <xsl:attribute name="xml:id">
                            <xsl:value-of select="$id" />
                        </xsl:attribute>
                        <xsl:apply-templates select="mei:note" />
                    </xsl:element>
                </xsl:element>
            </xsl:element>
        </xsl:element>
    </xsl:template>

    <xsl:template match="*[@plist]" />
    <xsl:template match="*[@startid]" />
</xsl:stylesheet>