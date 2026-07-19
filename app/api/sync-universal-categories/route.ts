import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";

export async function POST(req: Request) {
  try {
    const teacherId = await getCurrentTeacherId();
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { evaluationId } = await req.json();

    // Get the evaluation
    const evaluation = await prisma.class.findUnique({
      where: { id: evaluationId },
      include: {
        categories: {
          include: {
            subcategories: true,
          },
        },
        students: {
          include: {
            scores: true,
          },
        },
      },
    });

    if (!evaluation || evaluation.teacherId !== teacherId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only sync if it's a Universal Assessment
    if (evaluation.subject !== "Universal Assessment") {
      return NextResponse.json({ error: "Not a universal assessment" }, { status: 400 });
    }

    // Get the latest universal template
    const template = await prisma.universalTemplate.findUnique({
      where: { teacherId },
    });

    if (!template) {
      return NextResponse.json({ error: "No template found" }, { status: 404 });
    }

    const templateData = template.categories as {
      id: string;
      name: string;
      subcategories: { id: string; name: string }[];
    }[];

    // Build a map of existing categories and subcategories
    const existingCategories = new Map(
      evaluation.categories.map((cat) => [cat.name, cat])
    );

    // Track what we need to add
    const categoriesToAdd: { name: string; order: number; subcategories: { name: string; order: number }[] }[] = [];
    const subcategoriesToAdd: { categoryId: string; name: string; order: number }[] = [];

    // Compare template with existing
    templateData.forEach((templateCat, catIndex) => {
      const existingCat = existingCategories.get(templateCat.name);

      if (!existingCat) {
        // New category - add it
        categoriesToAdd.push({
          name: templateCat.name,
          order: catIndex,
          subcategories: templateCat.subcategories.map((sub, subIndex) => ({
            name: sub.name,
            order: subIndex,
          })),
        });
      } else {
        // Category exists - check for new subcategories
        const existingSubcategories = new Map(
          existingCat.subcategories.map((sub) => [sub.name, sub])
        );

        templateCat.subcategories.forEach((templateSub, subIndex) => {
          if (!existingSubcategories.has(templateSub.name)) {
            subcategoriesToAdd.push({
              categoryId: existingCat.id,
              name: templateSub.name,
              order: existingCat.subcategories.length + subcategoriesToAdd.filter(s => s.categoryId === existingCat.id).length + subIndex,
            });
          }
        });
      }
    });

    // Add new categories with subcategories
    for (const catData of categoriesToAdd) {
      const newCategory = await prisma.category.create({
        data: {
          classId: evaluationId,
          name: catData.name,
          order: catData.order,
          subcategories: {
            create: catData.subcategories,
          },
        },
      });

      // Create placeholder scores for the student (if exists)
      if (evaluation.students.length > 0) {
        const student = evaluation.students[0];
        
        // Create category score
        await prisma.score.create({
          data: {
            studentId: student.id,
            categoryId: newCategory.id,
            standardScore: 100,
          },
        });
      }
    }

    // Add new subcategories to existing categories
    for (const subData of subcategoriesToAdd) {
      await prisma.subcategory.create({
        data: subData,
      });

      // Create placeholder scores for the student (if exists)
      if (evaluation.students.length > 0) {
        const student = evaluation.students[0];
        
        await prisma.score.create({
          data: {
            studentId: student.id,
            categoryId: subData.categoryId,
            subcategoryId: (await prisma.subcategory.findFirst({
              where: {
                categoryId: subData.categoryId,
                name: subData.name,
              },
            }))?.id,
            standardScore: 100,
          },
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      added: {
        categories: categoriesToAdd.length,
        subcategories: subcategoriesToAdd.length,
      },
    });
  } catch (error) {
    console.error("Error syncing categories:", error);
    return NextResponse.json(
      { error: "Failed to sync categories" },
      { status: 500 }
    );
  }
}
